const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validatePoolId} = require('../validators')
const QueryBuilder = require('../query-builder')
const {preparePagedData} = require('../api-helpers')
const {matchPoolAssets} = require('./liquidity-pool-asset-matcher')

const emptyReserves = ['0', '0']

async function queryLiquidityPoolHistory(network, liquidityPool, path, {order, limit, from, to, cursor}) {
    validateNetwork(network)
    validatePoolId(liquidityPool)

    const pool = await db[network]
        .collection('liquidity_pools')
        .findOne({hash: liquidityPool})

    if (!pool)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified the liquidity pool id correctly.')

    const q = new QueryBuilder({pool: pool._id})
        .setSort('_id', order)
        .setLimit(limit)

    if (from) {
        q.addQueryFilter({ts: {$gte: from}})
    }

    if (to) {
        q.addQueryFilter({ts: {$lte: to}})
    }

    if (cursor) {
        q.addQueryFilter({_id: {[q.sort === 1 ? '$gt' : '$lt']: Long.fromString(cursor)}})
    }

    const history = await db[network].collection('liquidity_pool_history')
        .find(q.query)
        .limit(q.limit)
        .sort(q.sort)
        .toArray()

    if (!history.length)
        throw errors.notFound('Liquidity pool was not found on the ledger. Check if you specified the liquidity pool id correctly.')

    const poolAssets = await matchPoolAssets(network, pool)

    let prevAccounts = 0
    const res = history.map(entry => {
        const ts = entry._id.getHighBits()
        let accounts

        if (entry.accounts > 0) {
            accounts = prevAccounts = entry.accounts
        } else {
            accounts = entry.reserves.some(r => r && r.gt(0)) ? prevAccounts : 0
        }
        return {
            ts,
            paging_token: entry._id.toString(),
            shares: entry.shares || '0',
            accounts,
            trades: entry.trades || 0,
            reserves: poolAssets.match(pool, (pa, i) => ({
                asset: pa.name,
                amount: (entry.reserves || emptyReserves)[i]
            })),
            earned_fees: poolAssets.match(pool, (pa, i) => ({
                asset: pa.name,
                amount: entry.earned[i]
            })),
            volume: poolAssets.match(pool, (pa, i) => ({
                asset: pa.name,
                amount: entry.volume[i]
            })),
            total_value_locked: entry.tvl,
            earned_fees_value: entry.ev,
            volume_value: entry.vv,
            deleted: entry.deleted
        }
    })

    return preparePagedData(path, {
        order: q.sort,
        cursor,
        limit: q.limit,
        from,
        to
    }, res)
}

module.exports = {queryLiquidityPoolHistory}