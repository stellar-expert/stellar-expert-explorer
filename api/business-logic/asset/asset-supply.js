const db = require('../../connectors/mongodb-connector'),
    {validateNetwork, validateAssetName} = require('../validators'),
    AssetDescriptor = require('./asset-descriptor'),
    errors = require('../errors')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({name: new AssetDescriptor(asset).toFQAN()}, {projection: {_id: 0, supply: 1}})

    if (!assetInfo)
        throw errors.notFound('Asset supply was not found on the ledger. Check if you specified the asset correctly.')

    return (assetInfo.supply / 10000000).toFixed(7)
}

module.exports = {queryAssetSupply}