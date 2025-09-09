const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {normalizeOrder, preparePagedData, addPagingToken, calculateSequenceOffset} = require('../api-helpers')
const {validateNetwork} = require('../validators')
const {resolveAssetId} = require('../asset/asset-resolver')
const errors = require('../errors')

async function queryMarkets(network, basePath, {type, asset, sort, order, cursor, limit, skip}) {
    validateNetwork(network)
    let marketTypeFilter
    let reverseCondition
    switch (('' + type).toLowerCase()) {
        case 'xlm':
            marketTypeFilter = {asset: 0}
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
            marketTypeFilter = {asset: {$ne: 0}, type: {$nin: ['fiat, crypto']}}
            reverseCondition = undefined
            break
        default:
            marketTypeFilter = {}
            reverseCondition = undefined
            break
    }
    const q = new QueryBuilder({...marketTypeFilter, counterVolume7d: {$gt: 10}})
        .setSkip(calculateSequenceOffset(skip, limit, cursor, order))
        .setLimit(limit)

    //add filter by asset
    if (asset) {
        const assetId = await resolveAssetId(network, asset)
        if (assetId === null)
            throw errors.validationError('asset', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format or contract address.')
        let predicate = q.query.asset
        if (predicate === 0) {
            if (assetId > 0) {
                predicate = [0, assetId]
            }
        } else {
            predicate = assetId
        }
        q.addQueryFilter({asset: predicate})
    }

    const mandatoryProjectionFields = {
        asset: 1,
        created: 1,
        price: 1,
        price7d: 1,
        trades: 1,
        trades24h: 1,
        spread: 1,
        counterVolume24h: 1,
        counterVolume7d: 1,
        baseVolume24h: 1,
        baseVolume7d: 1,
        change24h: 1,
        change7d: 1
    }

    let sortOrder
    let adjustment = []
    //order is ignored for assets rating
    switch (sort) {
        case 'created':
            sortOrder = {created: 1}
            break
        case 'trades':
            sortOrder = {trades: -1}
            break
        case 'trades24h':
            sortOrder = {trades24h: -1}
            break
        case 'volume24h':
        default:
            sortOrder = {adjustedVolume: -1, counterVolume24h: -1}
            adjustment = [
                {
                    $lookup: {
                        from: 'assets',
                        localField: 'counterAsset',
                        foreignField: '_id',
                        as: 'assetInfo'
                    }
                },
                {
                    $project: {
                        ...mandatoryProjectionFields,
                        'priceMultiplier': {$arrayElemAt: ['$assetInfo', 0]}
                    }
                },
                {
                    $project: {
                        ...mandatoryProjectionFields,
                        adjustedVolume: {
                            $switch: {
                                branches: [
                                    {
                                        case: {$eq: ['$priceMultiplier._id', 0]},
                                        then: '$counterVolume24h'
                                    },
                                    {
                                        case: {$gt: ['$priceMultiplier.price', 0]},
                                        then: {$multiply: ['$counterVolume24h', '$priceMultiplier.price']}
                                    }
                                ],
                                default: 0
                            }
                        }
                    }
                }
            ]
            break
    }

    let markets = await db[network].collection('markets').aggregate([
        {
            $match: q.query
        },
        {
            $project: {
                reverse: reverseCondition,
                ...mandatoryProjectionFields
            }
        },
        {
            $project: {
                ...mandatoryProjectionFields,
                counterAsset: reverseCondition ? {$arrayElemAt: ['$asset', {$cond: ['$reverse', 1, 0]}]} : {$arrayElemAt: ['$asset', 0]},
                asset: reverseCondition ? {$cond: ['$reverse', {$reverseArray: '$asset'}, '$asset']} : 1,
                baseVolume24h: reverseCondition ? {$cond: ['$reverse', '$counterVolume24h', '$baseVolume24h']} : '$baseVolume24h',
                baseVolume7d: reverseCondition ? {$cond: ['$reverse', '$counterVolume7d', '$baseVolume7d']} : '$baseVolume7d',
                counterVolume24h: reverseCondition ? {$cond: ['$reverse', '$baseVolume24h', '$counterVolume24h']} : '$counterVolume24h',
                counterVolume7d: reverseCondition ? {$cond: ['$reverse', '$baseVolume7d', '$counterVolume7d']} : '$counterVolume7d'
            }
        },
        ...adjustment,
        {
            $sort: sortOrder
        },
        {
            $skip: q.skip
        },
        {
            $limit: q.limit
        }
    ])
        .toArray()

    //remap fields
    const assetResolver = new AssetJSONResolver(network)
    markets = markets.map(({_id, asset, ...other}) => ({
        id: _id,
        asset: asset.map(a => assetResolver.resolve(a)),
        ...other
    }))

    await assetResolver.fetchAll()
    addPagingToken(markets, q.skip)

    if (normalizeOrder(order) === 1) {
        markets.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, markets)
}

module.exports = {queryMarkets}