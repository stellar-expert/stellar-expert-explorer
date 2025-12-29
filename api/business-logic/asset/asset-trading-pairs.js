const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')

async function queryAssetTradingPairs(network, forAsset) {
    validateNetwork(network)
    forAsset = validateAssetName(forAsset)

    const markets = await db[network].collection('markets').aggregate([
        {
            $match: {asset: forAsset}
        },
        {
            $project: {
                _id: 0,
                asset: 1,
                quoteVolume24h: {$cond: [{$eq: [{$arrayElemAt: ['$asset', 1]}, forAsset]}, '$baseVolume24h', '$quoteVolume24h']}
            }
        },
        {
            $sort: {quoteVolume24h: -1}
        },
        {
            $limit: 10
        }])
        .toArray()

    if (!markets)
        return []
    //fetch all trading pairs
    return markets.map(({asset}) => asset[0] === forAsset ? asset[1] : asset[0])
}

module.exports = {queryAssetTradingPairs}