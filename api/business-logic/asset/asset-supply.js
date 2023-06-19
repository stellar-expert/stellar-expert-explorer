const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')
const AssetDescriptor = require('./asset-descriptor')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const a = await db[network].collection('assets')
        .findOne({name: new AssetDescriptor(asset).toFQAN()}, {projection: {supply: 1}})

    if (!a)
        throw errors.notFound('Asset supply was not found on the ledger. Check if you specified the asset correctly.')

    return (a.supply / 10000000).toFixed(7)
}

module.exports = {queryAssetSupply}