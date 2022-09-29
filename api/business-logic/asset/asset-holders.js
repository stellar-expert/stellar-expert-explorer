const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {resolveAssetId} = require('./asset-resolver')
const {resolveAccountId} = require('../account/account-resolver')
const {AccountAddressJSONResolver} = require('../account/account-resolver')
const {normalizeOrder, preparePagedData, normalizeLimit} = require('../api-helpers')
const {validateNetwork, validateAssetName, validateAccountAddress} = require('../validators')
const QueryBuilder = require('../query-builder')
const errors = require('../errors')

/**
 * Encode generic paging token for asset holders list query
 * @param {Number} account
 * @param {Long} balance
 * @return {String}
 * @internal
 */
function encodeAssetHoldersCursor(account, balance) {
    const buf = Buffer.allocUnsafe(12)
    //encode balance value
    buf.writeInt32BE(balance.getHighBits(), 0)
    buf.writeInt32BE(balance.getLowBits(), 4)
    //encode current account id
    buf.writeInt32BE(account, 8)
    return buf.toString('base64')
}

/**
 * Decode generic paging token for asset holders list query
 * @param {String} cursor
 * @return {{account, balance}}
 * @internal
 */
function decodeAssetHoldersCursor(cursor) {
    const buf = Buffer.from(cursor, 'base64')
    if (buf.length !== 12)
        throw new TypeError('Invalid cursor format')
    return {
        balance: new Long(buf.readUInt32BE(4), buf.readUInt32BE(0)),
        account: buf.readUInt32BE(8)
    }
}

/**
 * Retrieve a portion of asset holders for a given query condition
 * @param {String} network
 * @param {QueryBuilder} query
 * @param {[]} [existingRecords]
 * @return {Promise<{}[]>}
 * @internal
 */
async function fetchAssetHoldersBatch(network, query, existingRecords = []) {
    let limit = query.limit
    if (existingRecords.length) {
        limit -= existingRecords.length
        if (limit <= 0)
            return existingRecords
    }
    const records = await db[network].collection('trustlines')
        .find(query.query, {hint: {'asset': 1, 'balance': 1, 'account': 1}})
        .sort(query.sort)
        .limit(limit)
        .project({
            _id: 0,
            account: 1,
            balance: 1
        })
        .toArray()
    return existingRecords.length ?
        existingRecords.concat(records) :
        records
}

/**
 * Query all account addresses holding a specific asset
 */
async function queryAssetHolders(network, asset, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)
    validateAssetName(asset)

    //normalize input
    const normalizedOrder = normalizeOrder(order, 1)
    limit = normalizeLimit(limit)

    const assetId = await resolveAssetId(network, asset)

    if (assetId === null)
        throw errors.notFound()

    function buildQuery(condition) {
        return new QueryBuilder({asset: assetId, ...condition})
            .setLimit(limit)
            .setSort({asset: normalizedOrder, balance: normalizedOrder, account: normalizedOrder})
    }

    let records

    if (cursor) {
        //process Nth page response
        try {
            //retrieve paging conditions from the cursor
            const {balance, account} = decodeAssetHoldersCursor(cursor)
            //fetch holders with the same balance with regard to account cursor
            records = await fetchAssetHoldersBatch(network, buildQuery({
                balance,
                account: {[normalizedOrder === 1 ? '$gt' : '$lt']: account}
            }))
            //add results for holders with lower/higher balance, account cursor ignored here
            records = await fetchAssetHoldersBatch(network, buildQuery({
                balance: {[normalizedOrder === 1 ? '$gt' : '$lt']: balance}
            }), records)
        } catch (e) {
            throw errors.validationError('cursor', 'Invalid cursor format')
        }
    } else {
        //get the first page
        records = await fetchAssetHoldersBatch(network, buildQuery({balance: {$gt: 0}}))
    }

    for (let record of records) {
        //set generic paging token based on account balance and id
        record.paging_token = encodeAssetHoldersCursor(record.account, record.balance)
    }
    //resolve full account addresses
    const accountResolver = new AccountAddressJSONResolver(network)
    accountResolver.map(records, 'account')
    await accountResolver.fetchAll()

    //prepare paginated result
    return preparePagedData(basePath, {sort, order: normalizedOrder, cursor, limit}, records)
}


/**
 * Query balance position for a single account addresses holding a specific asset
 */
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

    if (!entry)
        throw  errors.notFound(`Trustline for account ${account} to asset ${asset} not found`)
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

/**
 * Retrieve data for an asset distribution chart based on the logarithmic scale
 */
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