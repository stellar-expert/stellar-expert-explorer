const db = require('../../connectors/mongodb-connector')
const {aggregateOhlcvt, parseBoundaries, encodeMarketOhlcvtId} = require('./ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')
const AssetDescriptor = require('../asset/asset-descriptor')
const errors = require('../errors')

async function aggregateMarketCandlesData(network, baseAsset, quoteAsset, query) {
    validateNetwork(network)
    validateAssetName(baseAsset)
    validateAssetName(quoteAsset)
    const {from, to, resolution, order} = parseBoundaries(query)

    const assets = await db[network].collection('assets')
        .find({
            name: {
                $in: [
                    new AssetDescriptor(baseAsset).toFQAN(),
                    new AssetDescriptor(quoteAsset).toFQAN()
                ]
            }
        }, {projection: {_id: 1, name: 1}})
        .toArray()
    if (assets.length < 2)
        throw errors.notFound(`Unknown asset pair ${baseAsset}/${quoteAsset}.`)
    //match the original assets
    if (assets[0].name !== new AssetDescriptor(baseAsset).toFQAN()) {
        assets.reverse()
    }
    const assetIds = assets.map(a => a._id)

    let reverse = false
    if (assetIds[1] < assetIds[0]) {
        assetIds.reverse()
        reverse = true
    }
    const fromId = encodeMarketOhlcvtId(assetIds, from)
    const toId = encodeMarketOhlcvtId(assetIds, to)

    const res = await aggregateOhlcvt({
        collection: 'market_ohlcvt',
        network,
        order,
        fromId,
        toId,
        resolution,
        reverse
    })
    return res
}

module.exports = {aggregateMarketCandlesData}