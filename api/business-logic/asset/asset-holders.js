const {Long} = require('bson'),
    db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {resolveAssetId} = require('./asset-resolver'),
    {resolveAccountId} = require('../account/account-resolver'),
    {AccountAddressJSONResolver} = require('../account/account-resolver'),
    {normalizeOrder, preparePagedData} = require('../api-helpers'),
    {validateNetwork, validateAssetName, validateAccountAddress} = require('../validators'),
    errors = require('../errors')

async function queryAssetHolders(network, asset, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetId = await resolveAssetId(network, asset)

    if (assetId === null) throw errors.notFound()

    const normalizedOrder = normalizeOrder(order, 1)

    const q = new QueryBuilder({balance: {$gt: 0}})
        .forAsset(assetId)
        .setLimit(limit)
        .setSort({balance: -1})

    if (cursor) {
        cursor = parseInt(cursor)
        if (isNaN(cursor) || cursor < 0) {
            cursor = undefined
        } else {
            q.setSkip(cursor)
        }
    }
    if (normalizedOrder === -1) {
        q.setSkip(q.skip - limit - 1)
        if (q.skip < 0) {
            q.setLimit(limit - q.skip)
            q.setSkip(0)
        }
    }

    const records = await db[network].collection('trustlines')
        .find(q.query)
        .sort({balance: -1})
        .skip(q.skip)
        .limit(q.limit)
        .project({
            _id: 0,
            account: 1,
            balance: 1
        })
        .toArray()

    for (let i = 0; i < records.length; i++) {
        let record = records[i]
        record.position = record.paging_token = q.skip + i + 1
    }

    if (normalizedOrder === -1) {
        records.reverse()
    }

    const accountResolver = new AccountAddressJSONResolver(network)
    accountResolver.map(records, 'account')

    await accountResolver.fetchAll()

    return preparePagedData(basePath, {sort, order: normalizedOrder, cursor, limit: q.limit}, records)
}

async function queryHolderPosition(network, asset, account) {
    validateNetwork(network)
    validateAssetName(asset)
    validateAccountAddress(account)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null) throw errors.notFound()

    const accountId = await resolveAccountId(network, account)

    const entry = await db[network].collection('trustlines')
        .findOne({
                account: accountId,
                asset: assetId
            },
            {
                projection: {
                    _id: 0,
                    balance: 1
                }
            })

    const position = await db[network].collection('trustlines')
        .countDocuments({asset: assetId, balance: {$gt: entry.balance}}) + 1

    const {trustlines} = await db[network].collection('assets')
        .findOne({_id: assetId}, {projection: {trustlines: 1}})

    if (!entry) throw errors.notFound()
    return {account, asset, total: trustlines.funded || trustlines.total || position, ...entry, position}
}

const distributionThresholds = {
    '1': '<0.001',
    '10000': '0.001-0.1',
    '1000000': '0.1-10',
    '100000000': '10-1K',
    '10000000000': '1K-100K',
    '1000000000000': '100K-10M',
    '100000000000000': '10M-1B',
    '10000000000000000': '1B-100B',
    '1000000000000000000': '>100B'
}

const distributionBoundaries = Object.keys(distributionThresholds).map(v => Long.fromString(v))

async function queryAssetDistribution(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null) throw errors.notFound()
    const distribution = await db[network].collection('trustlines').aggregate([
        {
            $match: {
                asset: assetId,
                balance: {$gt: 0}
            }
        },
        {
            $bucket: {
                groupBy: '$balance',
                boundaries: distributionBoundaries,
                default: 'gt',
                output: {count: {$sum: 1}}
            }
        }
    ]).toArray()

    const res = {}
    for (let key of Object.keys(distributionThresholds)) {
        res[key] = 0
    }

    for (let value of distribution) {
        let key = value._id.toString()
        if (key === 'gt') {
            key = Object.keys(distributionThresholds).pop()
        }
        res[key] = value.count
    }

    return Object.entries(res).map(([key, holders]) => ({range: distributionThresholds[key], holders}))
}

module.exports = {queryAssetHolders, queryHolderPosition, queryAssetDistribution}