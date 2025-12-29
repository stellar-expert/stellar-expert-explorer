const {aggregateOhlcvt, parseBoundaries} = require('../dex/ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')

async function aggregateAssetPriceCandlesData(network, asset, query) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const {from, to, resolution, order} = parseBoundaries(query)

    return aggregateOhlcvt({
        network,
        collection: 'asset_ohlcvt',
        predicate: {asset},
        order,
        from,
        to,
        resolution
    })
}

module.exports = {aggregateAssetPriceCandlesData}