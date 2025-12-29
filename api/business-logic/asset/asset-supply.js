const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')
const {combineAssetHistory} = require('./asset-aggregation')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const a = await db[network].collection('assets')
        .findOne({_id: asset}, {projection: {supply: 1}})

    if (!a)
        throw errors.notFound('Asset supply was not found on the ledger. Check if you specified the asset correctly.')
    const history = combineAssetHistory(a.history, asset !== 'XLM')
    return (history.supply / 10000000).toFixed(7)
}

module.exports = {queryAssetSupply}