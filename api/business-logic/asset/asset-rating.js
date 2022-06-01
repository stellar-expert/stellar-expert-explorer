const db = require('../../connectors/mongodb-connector'),
    {validateNetwork, validateAssetName} = require('../validators'),
    AssetDescriptor = require('./asset-descriptor'),
    errors = require('../errors')

async function queryAssetRating(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetFullName = new AssetDescriptor(asset).toFQAN()

    const assetInfo = await db[network].collection('assets')
        .find({name: assetFullName})
        .project({rating: 1})
        .toArray()

    if (!assetInfo.length)
        throw errors.notFound(`Asset ${assetFullName} wasn't found. Check if you specified the asset correctly.`)

    return Object.assign({asset: assetFullName, rating: assetInfo[0].rating})
}

module.exports = {queryAssetRating}