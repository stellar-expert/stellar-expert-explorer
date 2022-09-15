const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validatePoolId} = require('../validators')
const {matchPoolAssets} = require('./liquidity-pool-asset-matcher')
const errors = require('../errors')

async function queryLiquidityPoolStats(network, liquidityPool) {
    validateNetwork(network)
    validatePoolId(liquidityPool)
    const pool = await db[network]
        .collection('liquidity_pools')
        .findOne({hash: liquidityPool})
    if (!pool)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified liquidity pool id correctly.')

    const poolAssets = await matchPoolAssets(network, pool)

    return {
        id: liquidityPool,
        paging_token: liquidityPool,
        assets: poolAssets.match(pool, (pa, i) => ({amount: (pool.reserves || ['0', '0'])[i].toString(), ...pa})),
        type: pool.type,
        fee: pool.fee,
        shares: pool.shares || '0',
        accounts: pool.accounts || 0,
        trades: pool.trades,
        earned_fees: poolAssets.match(pool, (pa, i) => ({
            asset: pa.name,
            '1d': pool.earned24h[i],
            '7d': pool.earned7d[i],
            all_time: pool.earned[i]
        })),
        volume: poolAssets.match(pool, (pa, i) => ({
            asset: pa.name,
            '1d': pool.volume24h[i],
            '7d': pool.volume7d[i],
            all_time: pool.volume[i]
        })),
        total_value_locked: pool.tvl,
        volume_value: {
            '1d': pool.volumeValue24h,
            '7d': pool.volumeValue7d
        },
        earned_value: {
            '1d': pool.earnedValue24h,
            '7d': pool.earnedValue7d
        },
        created: pool.created,
        updated: pool.updated,
        deleted: pool.deleted
    }
}

module.exports = {queryLiquidityPoolStats}