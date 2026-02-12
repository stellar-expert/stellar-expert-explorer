const db = require('../../connectors/mongodb-connector')
const {fromStroops} = require('../../utils/formatter')
const {validateNetwork, validateAssetName, isValidContractAddress} = require('../validators')
const errors = require('../errors')
const {combineAssetHistory} = require('./asset-aggregation')

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)
    if (isValidContractAddress(asset)){
        const assetInfo = await db[network].collection('assets').findOne({_id:asset})
        if (!assetInfo)
            throw errors.notFound('Asset statistics were not found on the ledger. Check if you specified the asset correctly.')
        const combinedStats = combineAssetHistory(assetInfo.history, true)
        return fromStroops(combinedStats.supply)
    }

    const supplyInfo = await aggregateAssetSupply(network, [asset])
    const supply = supplyInfo[asset]
    if (!supply)
        throw errors.notFound('Asset was not found on the ledger. Check if you specified the asset correctly.')
    return fromStroops(supplyInfo[asset] || 0n)
}

async function aggregateAssetSupply(network, assets) {
    const totals = await Promise.all([
        loadBalanceSupply(network, assets),
        loadCBSupply(network, assets),
        loadLPSupply(network, assets)])
    const res = {}
    for (const data of totals) {
        for (let {supply, _id} of data) {
            res[_id] = (res[_id] || 0n) + BigInt(supply)
        }
    }
    return res
}

function loadBalanceSupply(network, assets) {
    return db[network].collection('balances').aggregate([
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
}

function loadCBSupply(network, assets) {
    return db[network].collection('claimable_balances').aggregate([
        {$match: {asset: {$in: assets}}},
        {
            $group: {
                _id: '$asset',
                supply: {$sum: '$amount'}
            }
        }
    ]).toArray()
}

function loadLPSupply(network, assets) {
    return db[network].collection('liquidity_pools').aggregate([
        {$match: {asset: {$in: assets}}},
        {
            $project: {
                data: [
                    {asset: {$first: '$asset'}, balance: {$first: '$reserves'}},
                    {asset: {$last: '$asset'}, balance: {$last: '$reserves'}}
                ]
            }
        },
        {$unwind: {path: '$data'}},
        {$replaceRoot: {newRoot: '$data'}},
        {$match: {asset: {$in: assets}}},
        {
            $group: {
                _id: '$asset',
                supply: {$sum: '$balance'}
            }
        }
    ]).toArray()
}

module.exports = {queryAssetSupply, aggregateAssetSupply}