const {validateNetwork, validateAssetName} = require('../validators')
const {aggregateOhlcvt, parseBoundaries} = require('./ohlcvt-aggregator')

async function aggregateMarketCandlesData(network, baseAsset, quoteAsset, query) {
    validateNetwork(network)
    const assets = [validateAssetName(baseAsset), validateAssetName(quoteAsset)]
    const {from, to, resolution, order} = parseBoundaries(query)
    //match the original assets
    let reverse = false
    if (assets[1] < assets[0]) {
        assets.reverse()
        reverse = true
    }

    const res = await aggregateOhlcvt({
        network,
        collection: 'market_ohlcvt',
        predicate: {assets: assets},
        order,
        from,
        to,
        resolution,
        reverse
    })
    return res
}

module.exports = {aggregateMarketCandlesData}