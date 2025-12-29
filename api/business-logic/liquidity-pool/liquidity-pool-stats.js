const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validatePoolId} = require('../validators')
const errors = require('../errors')
const {loadDailyOhlcPrices} = require('../dex/ohlcvt-aggregator')
const {unixNow} = require('../../utils/date-utils')
const {matchPoolAssets} = require('./liquidity-pool-asset-matcher')
const {aggregatePoolHistory, rehydratePoolHistory, estimatePoolTvl} = require('./liqudity-pool-aggregation')

async function queryLiquidityPoolStats(network, liquidityPool) {
    validateNetwork(network)
    liquidityPool = validatePoolId(liquidityPool)
    const pool = await db[network]
        .collection('liquidity_pools')
        .findOne({_id: liquidityPool})
    if (!pool)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified liquidity pool id correctly.')

    const poolAssets = await matchPoolAssets(network, pool)
    const prices = await loadDailyOhlcPrices(network, 'asset_ohlcvt', {$in: pool.asset}, unixNow() - 10 * 24 * 60 * 60)

    return preparePoolStatsResponse(pool, poolAssets, prices)
}

function preparePoolStatsResponse(pool, poolAssets, prices) {
    const history = rehydratePoolHistory(pool.history)
    const matchedPrices = [prices[pool.asset[0]], prices[pool.asset[1]]]
    const aggregated = aggregatePoolHistory(history, matchedPrices)
    return {
        id: pool._id,
        assets: poolAssets.match(pool, (pa, i) => ({amount: (pool.reserves || ['0', '0'])[i].toString(), ...pa})),
        type: pool.type,
        fee: pool.fee,
        shares: pool.shares || '0',
        accounts: pool.accounts || 0,
        trades: {
            '1d': aggregated.trades1d,
            '7d': aggregated.trades7d,
            all_time: aggregated.trades
        },
        earned_fees: pool.asset.map((asset, i) => ({
            '1d': aggregated.earned1d[i],
            '7d': aggregated.earned7d[i],
            all_time: aggregated.earned[i]
        })),
        volume: pool.asset.map((asset, i) => ({
            '1d': aggregated.volume1d[i],
            '7d': aggregated.volume7d[i],
            all_time: aggregated.volume[i]
        })),
        volume_value: pool.asset.map((asset, i) => ({
            '1d': aggregated.volume_value1d[i],
            '7d': aggregated.volume_value7d[i]
        })).reduce((v, a) => {
            a['1d'] += v['1d']
            a['7d'] += v['7d']
            return a
        }, {'1d': 0, '7d': 0}),
        earned_value: pool.asset.map((asset, i) => ({
            '1d': aggregated.earned_value1d[i],
            '7d': aggregated.earned_value7d[i]
        })).reduce((v, a) => {
            a['1d'] += v['1d']
            a['7d'] += v['7d']
            return a
        }, {'1d': 0, '7d': 0}),
        total_value_locked: estimatePoolTvl(pool.reserves, matchedPrices),
        created: pool.created,
        updated: pool.updated,
        deleted: pool.deleted
    }
}

module.exports = {queryLiquidityPoolStats, preparePoolStatsResponse}