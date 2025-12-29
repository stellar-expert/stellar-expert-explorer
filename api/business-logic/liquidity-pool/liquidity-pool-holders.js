const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const QueryBuilder = require('../query-builder')
const {normalizeOrder, preparePagedData} = require('../api-helpers')
const {validateNetwork, validateAccountAddress, validatePoolId} = require('../validators')

async function queryLiquidityPoolHolders(network, pool, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)
    pool = validatePoolId(pool)

    const poolInfo = await db[network].collection('liquidity_pools').findOne({_id: pool})
    if (!poolInfo)
        throw errors.notFound()

    const normalizedOrder = normalizeOrder(order, 1)

    const q = new QueryBuilder({
        asset: pool,
        balance: {$gt: 0}
    })
        .setLimit(limit)
        .setSort('balance', -1)

    if (cursor) {
        cursor = parseInt(cursor, 10)
        if (isNaN(cursor) || cursor < 0) {
            cursor = undefined
        } else {
            q.setSkip(cursor)
        }
    }
    if (normalizedOrder === -1) {
        q.setSkip(q.skip - limit - 1)
        if (q.skip < 0) {
            q.setLimit(limit - q.skip)
            q.setSkip(0)
        }
    }

    const records = await db[network].collection('balances')
        .find(q.query)
        .sort(q.sort)
        .skip(q.skip)
        .limit(q.limit)
        .project({
            _id: 0,
            address: 1,
            balance: 1
        })
        .toArray()

    for (let i = 0; i < records.length; i++) {
        let record = records[i]
        record.position = record.paging_token = q.skip + i + 1
        record.stake = record.balance
        record.account = record.address
        delete record.address
    }

    if (normalizedOrder === -1) {
        records.reverse()
    }

    return preparePagedData(basePath, {sort, order: normalizedOrder, cursor, limit: q.limit}, records)
}

async function queryLiquidityPoolPosition(network, pool, address) {
    validateNetwork(network)
    validateAccountAddress(address)
    pool = validatePoolId(pool)

    const poolInfo = await db[network].collection('liquidity_pools').findOne({_id: pool})
    if (!poolInfo)
        throw errors.notFound()

    const entry = await db[network].collection('balances')
        .findOne({address, asset: pool},
            {projection: {_id: 0, balance: 1}})
    if (!entry)
        throw errors.notFound()

    let [position, total] = await Promise.all([
        db[network].collection('balances').countDocuments({asset: pool, balance: {$gt: entry.balance}}),
        db[network].collection('balances').countDocuments({asset: pool, balance: {$gt: 0}})
    ])
    position++
    return {
        account: address,
        asset: pool,
        total,
        position,
        stake: entry.balance
    }
}

module.exports = {queryLiquidityPoolHolders, queryLiquidityPoolPosition}