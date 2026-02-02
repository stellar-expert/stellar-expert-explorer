const {aggregateOhlcvt, aggregateWeightedPrices, parseBoundaries} = require('../dex/ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')

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

/**
 * Aggregate weighted price data for given assets
 * @param {string} network
 * @param {{}} query
 * @return {Promise<{asset: string, prices: number[]}[]>}
 */
async function aggregateAssetWeightedPrices(network, query) {
    validateNetwork(network)
    if (!(query.asset instanceof Array) || !query.asset.length)
        throw errors.validationError('asset', `Missing asset list.`)
    if (query.asset.length > 50)
        throw errors.validationError('asset', `Too many assets specified in request. Maximum 50 allowed.`)
    const assets = query.asset.map(asset => validateAssetName(asset))
    //TODO: charge per record
    const {from, to, resolution, order} = parseBoundaries(query, 120_000)

    const res = await aggregateWeightedPrices({
        network,
        collection: 'asset_ohlcvt',
        predicate: {asset: {$in: assets}},
        order,
        from,
        to,
        resolution
    })
    return Object.entries(res).map(([asset, prices]) => ({asset, prices}))
}

module.exports = {aggregateAssetPriceCandlesData, aggregateAssetWeightedPrices}