const db = require('../../connectors/mongodb-connector'),
    {validateNetwork, validatePoolId} = require('../validators'),
    errors = require('../errors'),
    {matchPoolAssets} = require('./liquidity-pool-asset-matcher'),
    priceTracker = require('../ticker/price-tracker')

function adjustPrice(value) {
    if (!value) return 0
    return Math.round(value * priceTracker.recentPrice)
}

async function queryLiquidityPoolStats(network, liquidityPool) {
    validateNetwork(network)
    validatePoolId(liquidityPool)

    if (!priceTracker.initialized) {
        await priceTracker.init()
    }

    const pool = await db[network]
        .collection('liquidity_pools')
        .findOne({hash: liquidityPool})
    if (!pool)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified liquidity pool id correctly.')

    const poolAssets = await matchPoolAssets(network, pool)

    const res = {
        id: liquidityPool,
        paging_token: liquidityPool,
        assets: poolAssets.match(pool, (pa, i) => ({
            asset: pa.name,
            amount: (pool.reserves || ['0', '0'])[i].toString(),
            domain: pa.domain,
            toml_info: pa.tomlInfo || pa.toml_info
        })),
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
        total_value_locked: adjustPrice(pool.tvl),
        volume_value: {
            '1d': adjustPrice(pool.volumeValue24h),
            '7d': adjustPrice(pool.volumeValue7d)
        },
        earned_value: {
            '1d': adjustPrice(pool.earnedValue24h),
            '7d': adjustPrice(pool.earnedValue7d)
        },
        created: pool.created,
        updated: pool.updated,
        deleted: pool.deleted
    }

    return res
}




module.exports = {queryLiquidityPoolStats}