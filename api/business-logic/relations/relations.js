const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver')
const {AssetJSONResolver, resolveAssetIds, resolveAssetId} = require('../asset/asset-resolver')
const AssetDescriptor = require('../asset/asset-descriptor')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {validateNetwork, validateAccountAddress} = require('../validators')
const errors = require('../errors')

async function queryAccountRelations(network, account, basePath, {order, cursor, limit, asset}) {
    validateNetwork(network)
    validateAccountAddress(account)

    const accountId = await resolveAccountId(network, account)
    if (accountId === null)
        throw errors.validationError('account', `Account ${account} not found on the ledger`)

    limit = normalizeLimit(limit)
    let baseQuery = {accounts: accountId}
    const query = {
        $and: [baseQuery]
    }
    //add assets filter if present
    let assets
    if (asset instanceof Array) {
        assets = await parseAssets(network, asset)
        const assetMatch = []
        for (const [aid] of assets) {
            assetMatch.push({['v' + aid]: {$gt: 0}})
        }
        query.$and.push({$or: assetMatch})
    }

    if (cursor) {
        const parsedCursor = parseCursor(cursor)
        query.$and.push({
            $or: [
                {
                    weight: {$lt: parsedCursor.weight}
                },
                {
                    weight: parsedCursor.weight,
                    _id: {$gt: parsedCursor.id}
                }]
        })
    }

    const records = await db[network].collection('relations')
        .find(query, {sort: {weight: -1, _id: 1}, limit})
        .toArray()

    const accountResolver = new AccountAddressJSONResolver(network)
    const assetResolver = new AssetJSONResolver(network)

    const rows = records.map(record => {
        const {_id, accounts, type, created, updated, ft, bt, trades = 0, weight} = record
        const volumes = []
        for (const [key, amount] of Object.entries(record)) {
            if (key[0] !== 'v')
                continue
            const assetId = parseInt(key.substring(1), 10)
            if (assets) {
                const assetPair = assets.find(a => a[0] === assetId)
                if (assetPair) {
                    volumes.push({
                        asset: assetPair[1],
                        amount: typeof amount === 'number' ? amount : amount.toNumber()
                    })
                }
            } else {
                volumes.push({
                    asset: assetResolver.resolve(assetId),
                    amount: typeof amount === 'number' ? amount : amount.toNumber()
                })
            }
        }
        return {
            id: _id,
            paging_token: encodeCursor(weight, _id),
            accounts: accounts.map(a => accountResolver.resolve(a)),
            type,
            transfers: [ft || 0, bt || 0],
            trades,
            volumes,
            created,
            updated
        }
    })

    await accountResolver.fetchAll()
    await assetResolver.fetchAll()

    return preparePagedData(basePath, {order: 'desc', cursor, limit}, rows)
}

async function queryAccountRelationsStats(network, account, asset) {
    validateNetwork(network)
    validateAccountAddress(account)

    const accountId = await resolveAccountId(network, account)
    if (accountId === null)
        throw errors.validationError('account', `Account ${account} not found on the ledger`)
    const assets = await parseAssets(network, asset)
    const groupCondition = {}
    for (const [id] of assets) {
        groupCondition['v' + id] = {$sum: '$v' + id}
    }

    const relationStatRows = await db[network].collection('relations').aggregate([
        {
            $match: {accounts: accountId}
        },
        {
            $group: {
                _id: null,
                ...groupCondition,
                cnt: {$sum: 1}
            }
        }
    ]).toArray()

    const res = {
        account,
        relations: 0
    }
    if (!relationStatRows.length)
        return res
    const relationStats = relationStatRows[0]
    res.relations = relationStats.cnt
    res.volumes = []
    for (const [key, value] of Object.entries(relationStatRows[0])) {
        if (!key.startsWith('v'))
            continue
        const aid = parseInt(key.substring(1), 10)
        res.volumes.push({
            asset: assets.find(a => a[0] === aid)[1],
            volume: value
        })
    }
    return res
}

/**
 * @param {String} network
 * @param {String[]} asset
 * @return {Promise<[Number,String][]>}
 */
async function parseAssets(network, asset) {
    if (!(asset instanceof Array) || !asset.length)
        throw errors.validationError('asset', 'Missing asset selector. At least one asset is required.')
    if (asset.length > 5)
        throw errors.validationError('asset', 'Too many assets.')
    for (const entry of asset) {
        const assetId = await resolveAssetId(network, entry)
        if (assetId === null)
            throw errors.validationError('asset', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format or contract address.')
    }

    const normalizedAssets = asset.map(a => new AssetDescriptor(a).toFQAN())
    const assetIds = await resolveAssetIds(network, normalizedAssets)
    return assetIds.map((id, i) => [id, normalizedAssets[i]])
}

/**
 * @param {Number} weight
 * @param {Long} id
 * @return {String}
 */
function encodeCursor(weight, id) {
    return Math.floor(weight).toString(16).padStart(8, '0') + id.toString(16).padStart(16, '0')
}

/**
 * @param {String} cursor
 */
function parseCursor(cursor) {
    return {
        weight: parseInt(cursor.substring(0, 8), 16),
        id: new Long(parseInt(cursor.substring(16, 24), 16), parseInt(cursor.substring(8, 16), 16))
    }
}

module.exports = {queryAccountRelations, queryAccountRelationsStats}