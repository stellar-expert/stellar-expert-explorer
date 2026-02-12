const {Decimal128} = require('mongodb')
const db = require('../../connectors/mongodb-connector')
const {decimalToBigint, bigintToDecimal} = require('../../utils/decimal')
const {fetchBalances, countBalancesGt, normalizeBalanceValue} = require('../balance/balances')
const errors = require('../errors')
const QueryBuilder = require('../query-builder')
const {normalizeOrder, preparePagedData, normalizeLimit} = require('../api-helpers')
const {
    validateNetwork,
    validateAssetName,
    validateAccountAddress,
    validatePoolId,
    isValidContractAddress,
    isValidPoolId
} = require('../validators')

/**
 * Encode generic paging token for asset holders list query
 * @param {String} asset
 * @param {Buffer} id
 * @param {BigInt|Decimal128} balance
 * @return {String}
 * @internal
 */
function encodeAssetHoldersCursor(asset, id, balance) {
    let buf
    //encode balance value
    if (isValidContractAddress(asset)) {
        balance = decimalToBigint(balance)
        buf = Buffer.allocUnsafe(48)
        buf.writeBigUInt64BE(balance >> 64n, 0)
        buf.writeBigUInt64BE(balance & 0xFFFFFFFFFFFFFFFFn, 8)
        id.copy(buf, 16)
    } else {
        buf = Buffer.allocUnsafe(40)
        buf.writeBigUInt64BE(balance, 0)
        id.copy(buf, 8)
    }
    return buf.toString('base64')
}

/**
 * Decode generic paging token for asset holders list query
 * @param {String} cursor
 * @return {{balance: BigInt, id: Buffer}}
 * @internal
 */
function decodeAssetHoldersCursor(cursor) {
    const buf = Buffer.from(cursor, 'base64')
    switch (buf.length) {
        case 40:
            return {
                balance: buf.readBigUInt64BE(0),
                id: buf.subarray(8)
            }
        case 48:
            return {
                balance: bigintToDecimal(buf.readBigUInt64BE(0) << 64n | buf.readBigUInt64BE(8)),
                id: buf.subarray(16)
            }
        default:
            throw new TypeError('Invalid cursor format')
    }
}

/**
 * Retrieve a portion of asset holders for a given query condition
 * @param {String} network
 * @param {String} asset
 * @param {QueryBuilder} query
 * @return {Promise<{}[]>}
 * @internal
 */
async function fetchAssetHoldersBatch(network, asset, query) {
    return await fetchBalances(network, query.query, {
        sort: query.sort,
        limit: query.limit,
        projection: {_id: 1, address: 1, balance: 1},
        hint: {asset: 1, balance: -1, _id: 1}
    })
}

/**
 * Query all account addresses holding a specific asset
 */
async function queryAssetHolders(network, asset, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)

    if (isValidPoolId(asset)) {
        asset = validatePoolId(asset)
    } else {
        asset = validateAssetName(asset)
    }
    if (!asset)
        throw errors.notFound()
    //normalize input
    order = normalizeOrder(order, 1)
    limit = normalizeLimit(limit)

    function buildQuery(condition) {
        return new QueryBuilder(condition)
            .setLimit(limit)
            .setSort({asset: 1, balance: order, _id: order})
    }

    let records

    if (cursor) {
        //process N-th page response
        try {
            //retrieve paging conditions from the cursor
            let {balance, id} = decodeAssetHoldersCursor(cursor)
            balance = normalizeBalanceValue(asset, balance)
            const query = {
                $or: [
                    {
                        asset,
                        balance: order === 1 ? //add results for holders with lower/higher balance, id cursor ignored here
                            {$gt: balance} :
                            {$gt: 0, $lt: balance}
                    },
                    {
                        asset,
                        balance, //fetch holders with the same balance with regard to account cursor
                        _id: {[order === 1 ? '$gt' : '$lt']: id}
                    }
                ]
            }
            records = await fetchAssetHoldersBatch(network, asset, buildQuery(query))
        } catch (e) {
            throw errors.validationError('cursor', 'Invalid cursor format')
        }
    } else {
        //get the first page
        records = await fetchAssetHoldersBatch(network, asset, buildQuery({
            asset,
            balance: {$gt: 0n}
        }))
    }

    for (const record of records) {
        //set generic paging token based on account balance and id
        record.account = record.address //TODO: backward compatibility with the old API, remove in future versions
        record.paging_token = encodeAssetHoldersCursor(asset, record._id.buffer, record.balance)
        record.balance = record.balance.toString()
        delete record._id
    }
    //prepare paginated result
    return preparePagedData(basePath, {sort, order, cursor, limit}, records)
}


/**
 * Query balance position for a single account address holding a specific asset
 */
async function queryHolderPosition(network, asset, address) {
    validateNetwork(network)
    validateAccountAddress(address)
    asset = validateAssetName(asset)

    const [entry] = await fetchBalances(network, {address, asset}, {
        projection: {_id: 0, balance: 1},
        limit: 1
    })

    if (!entry)
        throw errors.notFound(`Asset ${asset} balance for address ${address} not found`)
    const position = (await countBalancesGt(network, asset, entry.balance)) + 1
    const total = await countBalancesGt(network, asset, 0n)

    if (!entry)
        throw errors.notFound()
    return {
        account: address,//TODO: obsolete - remove in future versions
        address: address,
        asset,
        balance: entry.balance,
        position,
        total: total || position
    }
}

const distributionThresholds = {
    '<0.001': 0,
    '0.001-0.1': 0.001,
    '0.1-10': 0.1,
    '10-1K': 10,
    '1K-100K': 1000,
    '100K-10M': 100000,
    '10M-1B': 10000000,
    '1B-100B': 1000000000,
    '>100B': 100000000000
}

const distributionBoundaries = Object.values(distributionThresholds)
    .sort((a, b) => a - b)

/**
 * Retrieve data for an asset distribution chart based on the logarithmic scale
 */
async function queryAssetDistribution(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    if (isValidContractAddress(asset))
        return [] //cannot query data for token assets the same way as classic

    const assetInfo = await db[network].collection('assets')
        .findOne({_id: asset}, {projection: {_id: 1, decimals: 1}})
    if (!assetInfo)
        throw errors.notFound()
    const distribution = await db[network].collection('balances').aggregate([
        {
            $match: {
                asset,
                balance: {$gt: 0}
            }
        },
        {
            $bucket: {
                groupBy: {$divide: ['$balance', 10 ** (assetInfo.decimals ?? 7)]},
                boundaries: distributionBoundaries,
                default: 'gt',
                output: {count: {$sum: 1}}
            }
        }
    ]).toArray()

    const res = {}
    for (const key of Object.keys(distributionThresholds)) {
        res[key] = 0
    }

    for (const value of distribution) {
        let key = value._id.toString()
        if (key === 'gt') {
            key = Object.keys(distributionThresholds).pop()
        }
        res[key] = value.count
    }
    return Object.entries(distributionThresholds)
        .map(([label, threshold]) => ({range: label, holders: res[threshold]}))
        .filter(({holders}) => holders > 0)
        .sort()
}

module.exports = {queryAssetHolders, queryHolderPosition, queryAssetDistribution}