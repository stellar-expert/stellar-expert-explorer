const errors = require('../errors')
const {validateNetwork, validateAssetName} = require('../validators')
const AssetDescriptor = require('../asset/asset-descriptor')
const {resolveAssetIds} = require('../asset/asset-resolver')
const {aggregateOhlcvt, parseBoundaries, encodeMarketOhlcvtId} = require('./ohlcvt-aggregator')

async function aggregateMarketCandlesData(network, baseAsset, quoteAsset, query) {
    validateNetwork(network)
    validateAssetName(baseAsset)
    validateAssetName(quoteAsset)
    const {from, to, resolution, order} = parseBoundaries(query)

    const assetIds = await resolveAssetIds(network, [new AssetDescriptor(baseAsset).toFQAN(), new AssetDescriptor(quoteAsset).toFQAN()])
    if (assetIds.some(a => !(a >= 0)) || assetIds.length < 2)
        throw errors.notFound(`Unknown asset pair ${baseAsset}/${quoteAsset}.`)
    //match the original assets

    let reverse = false
    if (assetIds[1] < assetIds[0]) {
        assetIds.reverse()
        reverse = true
    }
    const fromId = encodeMarketOhlcvtId(assetIds, from)
    const toId = encodeMarketOhlcvtId(assetIds, to)

    return await aggregateOhlcvt({
        collection: 'market_ohlcvt',
        network,
        order,
        fromId,
        toId,
        resolution,
        reverse
    })
}

module.exports = {aggregateMarketCandlesData}