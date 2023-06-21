const errors = require('../errors')
const AssetDescriptor = require('../asset/asset-descriptor')
const {validateNetwork} = require('../api-helpers')
const {unixNow} = require('../../utils/date-utils')
const {formatPercentage, formatAmount, adjustAmount, formatWithPrecision} = require('../../utils/formatter')
const {aggregateOhlcvt, encodeAssetOhlcvtId, encodeMarketOhlcvtId, OHLCVT} = require('../dex/ohlcvt-aggregator')
const {validateAssetName} = require('../validators')
const {resolveAssetIds} = require('../asset/asset-resolver')

async function queryAssetTicker(network, symbol) {
    validateNetwork(network)
    if (!symbol || typeof symbol !== 'string')
        throw errors.badRequest('Invalid market symbol: ' + symbol)

    const [baseAsset, quoteAsset] = symbol.split('_')
    if (!baseAsset || !quoteAsset)
        throw errors.badRequest('Invalid market symbol: ' + symbol)

    validateAssetName(baseAsset)
    validateAssetName(quoteAsset)

    const assetIds = await resolveAssetIds(network, [new AssetDescriptor(baseAsset).toFQAN(), new AssetDescriptor(quoteAsset).toFQAN()])
    if (assetIds.some(a => !a) || assetIds.length < 2)
        throw errors.notFound(`Unknown asset pair ${baseAsset}/${quoteAsset}.`)
    //match the original assets

    let reverse = false
    if (assetIds[1] < assetIds[0]) {
        assetIds.reverse()
        reverse = true
    }
    const dateNow = unixNow()
    const dateFrom = dateNow - 24 * 60 * 60 //last 24h

    const fromId = encodeMarketOhlcvtId(assetIds, dateFrom)
    const toId = encodeMarketOhlcvtId(assetIds, dateNow)

    const data = await aggregateOhlcvt({
        collection: 'market_ohlcvt',
        network,
        order: 1,
        fromId,
        toId,
        resolution: 86400,
        reverse
    })
    /*
    //find first op that matches dateFrom timestamp
    const [firstOp] = await db[network].collection('operations')
        .find({ts: {$gte: dateFrom}})
        .sort({_id: 1})
        .limit(1)
        .project({_id: 1})
        .toArray()

    //aggregate effects
    const [data] = await db[network].collection('effects')
        .aggregate([
            {
                $match: {
                    asset: [new AssetDescriptor(baseAsset).toFQAN(), new AssetDescriptor(quoteAsset).toFQAN()],
                    type: 33,
                    _id: {$gte: generateEffectId(firstOp._id)},
                    'amount.0': {$gt: 0}
                }
            },
            {
                $sort: {
                    _id: 1
                }
            },
            {
                $project: {
                    _id: 1,
                    price: {$divide: [{$arrayElemAt: ['$amount', 0]}, {$arrayElemAt: ['$amount', 1]}]},
                    baseVolume: {$arrayElemAt: ['$amount', 0]},
                    quoteVolume: {$arrayElemAt: ['$amount', 1]}
                }
            },
            {
                $group: {
                    _id: null,
                    openPrice: {$first: '$price'},
                    highPrice: {$max: '$price'},
                    lowPrice: {$min: '$price'},
                    closePrice: {$last: '$price'},
                    baseVolume: {$sum: '$baseVolume'},
                    quoteVolume: {$sum: '$quoteVolume'},
                    tradesCount: {$sum: new Int32(1)}
                }
            }
        ])
        .toArray()*/

    const res = {
        symbol,
        openTime: dateFrom,
        closeTime: dateNow,
        tradesCount: 0
    }

    //normalize data
    if (data?.length) {
        let [first, last] = data
        const single = !last
        if (single) {
            last = first
        }
        res.priceChangePercent = formatPercentage((last[OHLCVT.CLOSE] - first[OHLCVT.OPEN]) / first[OHLCVT.OPEN])
        res.openPrice = formatWithPrecision(first[OHLCVT.OPEN])
        res.highPrice = formatWithPrecision(Math.max(first[OHLCVT.HIGH], last[OHLCVT.HIGH]))
        res.lowPrice = formatWithPrecision(Math.min(first[OHLCVT.LOW], last[OHLCVT.LOW]))
        res.closePrice = formatWithPrecision(first[OHLCVT.CLOSE])
        res.baseVolume = adjustAmount(single ? first[OHLCVT.BASE_VOLUME] : (first[OHLCVT.BASE_VOLUME] + last[OHLCVT.BASE_VOLUME]))
        res.quoteVolume = adjustAmount(single ? first[OHLCVT.QUOTE_VOLUME] : (first[OHLCVT.QUOTE_VOLUME] + last[OHLCVT.QUOTE_VOLUME]))
        res.tradesCount = single ? first[OHLCVT.TRADES_COUNT] : (first[OHLCVT.TRADES_COUNT] + last[OHLCVT.TRADES_COUNT])
    }
    return res
}

module.exports = {queryAssetTicker}