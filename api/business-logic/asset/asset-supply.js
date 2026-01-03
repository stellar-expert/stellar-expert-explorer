const db = require('../../connectors/mongodb-connector')
const {fromStroops} = require('../../utils/formatter')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const supplyInfo  = await aggregateAssetSupply(network, [asset])
    const supply = supplyInfo[asset]
    if (!supply)
        throw errors.notFound('Asset was not found on the ledger. Check if you specified the asset correctly.')
    return fromStroops(supplyInfo[asset] || 0n)
}

async function aggregateAssetSupply(network, assets) {
    const data = await db[network].collection('balances').aggregate([
        {
            $match: {
                asset: {$in: assets},
                balance: {$gt: 0}
            }
        },
        {
            $group: {
                _id: '$asset',
                supply: {$sum: '$balance'}
            }
        }
    ]).toArray()
    const res = {}
    for (let {supply, _id} of data) {
        res[_id] = supply
    }
    return res
}

module.exports = {queryAssetSupply, aggregateAssetSupply}