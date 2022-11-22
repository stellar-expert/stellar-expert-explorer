const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')
const {resolveAssetId} = require('./asset-resolver')

async function fetchLiquidityPoolsSupply(assetIds, network) {
    return await db[network].collection('liquidity_pools').aggregate([
        {
            $match: {asset: {$in: assetIds}, shares: {$gt: 0}}
        },
        {
            $project: {
                asset: 1,
                reserves: 1
            }
        },
        {
            $unwind: {
                path: '$asset',
                includeArrayIndex: 'idx'
            }
        },
        {
            $match: {asset: {$in: assetIds}}
        },
        {
            $group: {
                _id: '$asset',
                supply: {$sum: {$arrayElemAt: ['$reserves', '$idx']}}
            }
        }
    ]).toArray()
}

async function fetchClaimableBalancesSupply(assetIds, network) {
    return await db[network].collection('claimable_balances').aggregate([
        {
            $match: {asset: {$in: assetIds}, deleted: {$exists: false}}
        },
        {
            $group: {
                _id: '$asset',
                supply: {$sum: '$amount'}
            }
        }
    ], {hint: {asset: 1}}).toArray()
}

async function fetchTrustlinesSupply(assetIds, network) {
    return await db[network].collection('trustlines').aggregate([
        {
            $match: {asset: {$in: assetIds}}
        },
        {
            $group: {
                _id: '$asset',
                supply: {$sum: '$balance'}
            }
        }
    ], {hint: {asset: 1}}).toArray()
}

/**
 *
 * @param {Number[]} assetIds
 * @param {String} network
 * @return {Promise<Object.<String,Number>>}
 */
async function fetchAssetsSupply(assetIds, network) {
    const promises = [fetchTrustlinesSupply, fetchLiquidityPoolsSupply]
        .map(f => f.call(null, assetIds, network))
    const supplyResults = await Promise.all(promises)
    const supplyMap = {}
    for (const res of supplyResults) {
        for (const {_id, supply} of res) {
            const prevSupply = supplyMap[_id] || 0
            supplyMap[_id] = prevSupply + (typeof supply === 'number' ? supply : supply.toNumber())
        }
    }
    return supplyMap
}

async function queryAssetSupply(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null)
        throw errors.notFound('Asset supply was not found on the ledger. Check if you specified the asset correctly.')

    const res = await fetchAssetsSupply([assetId], network)
    const supply = res[assetId]

    return (supply / 10000000).toFixed(7)
}

module.exports = {queryAssetSupply, fetchAssetsSupply}