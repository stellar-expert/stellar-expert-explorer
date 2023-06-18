const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validateAssetName} = require('../validators')
const {resolveAssetId, AssetJSONResolver} = require('./asset-resolver')

async function queryAssetTradingPairs(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null) throw errors.notFound('Unknown asset: ' + asset)

    const markets = await db[network].collection('markets').aggregate([
        {
            $match: {asset: assetId}
        },
        {
            $project: {
                asset: 1,
                counterVolume24h: {$cond: [{$eq: [{$arrayElemAt: ['$asset', 1]}, assetId]}, '$baseVolume24h', '$counterVolume24h']}
            }
        },
        {
            $sort: {counterVolume24h: -1}
        },
        {
            $limit: 10
        }])
        .toArray()

    if (!markets) return []
    const resolver = new AssetJSONResolver(network)
    //fetch all trading pairs
    const pairs = markets.map(({asset}) => asset[0] === assetId ? asset[1] : asset[0])
    resolver.map(pairs)
    await resolver.fetchAll()
    return pairs
}

module.exports = {queryAssetTradingPairs}