const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validatePoolId} = require('../validators')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {loadDailyOhlcPrices} = require('../dex/ohlcvt-aggregator')
const {rehydratePoolHistory} = require('./liqudity-pool-aggregation')
const {unixNow} = require('../../utils/date-utils')

async function queryLiquidityPoolHistory(network, liquidityPool, path, {order, limit, cursor}) {
    validateNetwork(network)
    liquidityPool = validatePoolId(liquidityPool)
    order = normalizeOrder(order, -1)
    limit = normalizeLimit(limit, 20, 200)


    const pool = await db[network]
        .collection('liquidity_pools')
        .findOne({_id: liquidityPool})

    if (!pool)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified the liquidity pool id correctly.')

    const from = unixNow() - 180 * 24 * 60 * 60 //take last 6 months
    const prices = await loadDailyOhlcPrices(network, 'asset_ohlcvt', {$in: pool.asset}, from)
    let history = rehydratePoolHistory(pool.history, [prices[pool.asset[0]], prices[pool.asset[1]]], from)

    if (order === -1) {
        history.reverse()
    }
    if (cursor) {
        cursor = parseInt(cursor, 10)
        const cursorIdx = history.findIndex(h => h.ts === cursor)
        history = history.slice(cursorIdx + 1)
    }
    history = history.slice(0, limit)

    return preparePagedData(path, {order, cursor, limit}, history)
}


module.exports = {queryLiquidityPoolHistory}