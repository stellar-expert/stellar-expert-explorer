const db = require('../../connectors/mongodb-connector')
const {fromStroops} = require('../../utils/formatter')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')
const {combineAssetHistory} = require('./asset-aggregation')
const {getSupplyInfo} = require('./asset-stats')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({_id: asset}, {projection: {history: 1, reserve: 1}})

    if (!assetInfo)
        throw errors.notFound('Asset was not found on the ledger. Check if you specified the asset correctly.')
    const history = asset !== 'XLM' && combineAssetHistory(assetInfo.history)
    let {supply, reserve} = await getSupplyInfo(network, assetInfo, history)
    if (reserve) {
        supply -= reserve
    }
    return fromStroops(supply)
}

module.exports = {queryAssetSupply}