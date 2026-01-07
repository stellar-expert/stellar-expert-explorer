const {aggregateOhlcvt, parseBoundaries} = require('../dex/ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')

/**
 * Aggregate price OHLCV data for the specified asset
 * @param {string} network
 * @param {asset} asset
 * @param {{}} query
 * @return {Promise<Promise<[][]>>}
 */
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