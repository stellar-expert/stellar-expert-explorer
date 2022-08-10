const {aggregateOhlcvt, parseBoundaries, encodeAssetOhlcvtId} = require('../dex/ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')
const {resolveAssetId} = require('./asset-resolver')
const errors = require('../errors')

async function aggregateAssetPriceCandlesData(network, asset, query) {
    validateNetwork(network)
    validateAssetName(asset)

    const {from, to, resolution, order} = parseBoundaries(query)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null)
        throw errors.notFound(`Unknown asset ${asset}.`)

    const fromId = encodeAssetOhlcvtId(assetId, from)
    const toId = encodeAssetOhlcvtId(assetId, to)

    const res = await aggregateOhlcvt({
        collection: 'asset_ohlcvt',
        network,
        order,
        fromId,
        toId,
        resolution
    })
    return res
}

module.exports = {aggregateAssetPriceCandlesData}