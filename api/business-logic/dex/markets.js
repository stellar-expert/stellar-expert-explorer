const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {normalizeOrder, preparePagedData, addPagingToken, calculateSequenceOffset} = require('../api-helpers')
const {validateNetwork, validateAssetName} = require('../validators')

async function queryMarkets(network, basePath, {type, asset, sort, order, cursor, limit, skip}) {
    validateNetwork(network)
    let marketTypeFilter
    let reverseCondition
    switch (('' + type).toLowerCase()) {
        case 'xlm':
            marketTypeFilter = {asset: 'XLM'}
            reverseCondition = undefined //{$eq: [{$arrayElemAt: ['$asset', 1]}, 0]}
            break
        case 'fiat':
            marketTypeFilter = {type: 'fiat'}
            reverseCondition = {$and: [{$eq: [{$arrayElemAt: ['$type', 1]}, 'fiat']}, {$ne: [{$arrayElemAt: ['$type', 0]}, 'fiat']}]}
            break
        case 'crypto':
            marketTypeFilter = {type: 'crypto'}
            reverseCondition = {$and: [{$eq: [{$arrayElemAt: ['$type', 1]}, 'crypto']}, {$ne: [{$arrayElemAt: ['$type', 0]}, 'crypto']}]}
            break
        case 'other':
            marketTypeFilter = {asset: {$ne: 'XLM'}, type: {$nin: ['fiat, crypto']}}
            reverseCondition = undefined
            break
        default:
            marketTypeFilter = {}
            reverseCondition = undefined
            break
    }
    const q = new QueryBuilder({...marketTypeFilter, quoteVolume7d: {$gt: 10}})
        .setSkip(calculateSequenceOffset(skip, limit, cursor, order))
        .setLimit(limit)

    //add filter by asset
    if (asset) {
        asset = validateAssetName(asset)
        let predicate = q.query.asset
        if (predicate === 'XLM') {
            predicate = ['XLM', asset]
        } else {
            predicate = asset
        }
        q.addQueryFilter({asset: predicate})
    }

    let sortOrder
    //order is ignored for assets rating
    switch (sort) {
        case 'created':
            sortOrder = {created: 1}
            break
        case 'trades7d':
            sortOrder = {trades7d: -1}
            break
        case 'trades24h':
        default:
            sortOrder = {trades24h: -1}
            break
    }

    let markets = await db[network].collection('markets').aggregate([
        {
            $match: q.query
        },
        {
            $sort: sortOrder
        },
        {
            $skip: q.skip
        },
        {
            $limit: q.limit
        },
        {
            $project: {
                _id: 0,
                reverse: reverseCondition,
                asset: 1,
                price7d: 1,
                trades24h: 1,
                quoteVolume24h: 1,
                quoteVolume7d: 1,
                baseVolume24h: 1,
                baseVolume7d: 1
            }
        },
        {
            $project: {
                asset: reverseCondition ? {$cond: ['$reverse', {$reverseArray: '$asset'}, '$asset']} : 1,
                base_volume24h: reverseCondition ? {$cond: ['$reverse', '$quoteVolume24h', '$baseVolume24h']} : '$baseVolume24h',
                base_volume7d: reverseCondition ? {$cond: ['$reverse', '$quoteVolume7d', '$baseVolume7d']} : '$baseVolume7d',
                quote_volume24h: reverseCondition ? {$cond: ['$reverse', '$baseVolume24h', '$quoteVolume24h']} : '$quoteVolume24h',
                quote_volume7d: reverseCondition ? {$cond: ['$reverse', '$baseVolume7d', '$quoteVolume7d']} : '$quoteVolume7d',
                price7d: 1,
                trades24h: 1
            }
        }
    ])
        .toArray()

    addPagingToken(markets, q.skip)

    if (normalizeOrder(order) === 1) {
        markets.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, markets)
}

module.exports = {queryMarkets}