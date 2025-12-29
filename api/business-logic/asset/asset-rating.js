const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')

async function queryAssetRating(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({_id: asset}, {projection: {_id: 0, rating: 1}})
        .project({rating: 1})

    if (!assetInfo)
        throw errors.notFound(`Asset ${asset} wasn't found. Check if you specified the asset correctly.`)

    return Object.assign({asset, rating: assetInfo.rating})
}

module.exports = {queryAssetRating}