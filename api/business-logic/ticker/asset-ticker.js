const db = require('../../connectors/mongodb-connector'),
    {Int32} = require('bson'),
    AssetDescriptor = require('../asset/asset-descriptor'),
    {validateNetwork} = require('../api-helpers'),
    {generateEffectId} = require('../../utils/generic-id-utils'),
    errors = require('../errors'),
    {formatPercentage, formatAmount, adjustAmount, formatWithPrecision} = require('../../utils/formatter'),
    {unixNow} = require('../../utils/date-utils')

async function queryAssetTicker(network, symbol) {
    validateNetwork(network)
    if (!symbol || typeof symbol !== 'string') throw errors.badRequest('Invalid market symbol: ' + symbol)

    const [baseAsset, quoteAsset] = symbol.split('_')
    if (!baseAsset || !quoteAsset) throw errors.badRequest('Invalid market symbol: ' + symbol)

    const dateNow = unixNow(),
        dateFrom = dateNow - 24 * 60 * 60 //last 24h

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
                    type: Int32(33),
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
                    tradesCount: {$sum: Int32(1)}
                }
            }
        ])
        .toArray()

    const res = {
            symbol,
            openTime: dateFrom,
            closeTime: dateNow,
            tradesCount: 0
        }

    //normalize data
    if (data) {
        res.priceChangePercent = formatPercentage((data.closePrice - data.openPrice) / data.openPrice)
        res.openPrice = formatWithPrecision(data.openPrice,1)
        res.highPrice = formatWithPrecision(data.highPrice)
        res.lowPrice = formatWithPrecision(data.lowPrice)
        res.closePrice = formatWithPrecision(data.closePrice)
        res.baseVolume = adjustAmount(data.baseVolume)
        res.quoteVolume = adjustAmount(data.quoteVolume)
        res.tradesCount = data.tradesCount
    }
    return res
}

module.exports = {queryAssetTicker}