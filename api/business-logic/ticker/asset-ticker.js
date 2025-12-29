const errors = require('../errors')
const {validateNetwork} = require('../api-helpers')
const {unixNow} = require('../../utils/date-utils')
const {formatPercentage, adjustAmount, formatWithPrecision} = require('../../utils/formatter')
const {aggregateOhlcvt, OHLCVT} = require('../dex/ohlcvt-aggregator')
const {validateAssetName} = require('../validators')

async function queryAssetTicker(network, symbol) {
    validateNetwork(network)
    if (!symbol || typeof symbol !== 'string')
        throw errors.badRequest('Invalid market symbol: ' + symbol)

    const [baseAsset, quoteAsset] = symbol.split('_')
    if (!baseAsset || !quoteAsset)
        throw errors.badRequest('Invalid market symbol: ' + symbol)

    const assets = [validateAssetName(baseAsset), validateAssetName(quoteAsset)]
    let reverse = false
    if (assets[1] < assets[0]) {
        assets.reverse()
        reverse = true
    }
    const dateNow = unixNow()
    const from = dateNow - 24 * 60 * 60 //last 24h

    const data = await aggregateOhlcvt({
        network,
        collection: 'market_ohlcvt',
        predicate: {assets},
        order: 1,
        from,
        to:dateNow,
        resolution: 86400,
        reverse
    })

    const res = {
        symbol,
        openTime: from,
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