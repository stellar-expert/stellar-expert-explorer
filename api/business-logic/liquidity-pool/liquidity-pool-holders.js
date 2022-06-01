const {Long} = require('bson'),
    db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {resolveLiquidityPoolId} = require('./liquidity-pool-resolver'),
    {resolveAccountId} = require('../account/account-resolver'),
    {AccountAddressJSONResolver} = require('../account/account-resolver'),
    {normalizeOrder, preparePagedData} = require('../api-helpers'),
    {validateNetwork, validateAccountAddress, validatePoolId} = require('../validators'),
    errors = require('../errors')

async function queryLiquidityPoolHolders(network, pool, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)
    validatePoolId(pool)

    const poolId = await resolveLiquidityPoolId(network, pool)

    if (poolId === null) throw errors.notFound()

    const normalizedOrder = normalizeOrder(order, 1)

    const q = new QueryBuilder({stake: {$gt: 0}, pool: poolId})
        .setLimit(limit)
        .setSort({stake: -1})

    if (cursor) {
        cursor = parseInt(cursor)
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

    const records = await db[network].collection('liquidity_pool_stakes')
        .find(q.query)
        .sort({stake: -1})
        .skip(q.skip)
        .limit(q.limit)
        .project({
            _id: 0,
            account: 1,
            stake: 1
        })
        .toArray()

    for (let i = 0; i < records.length; i++) {
        let record = records[i]
        record.position = record.paging_token = q.skip + i + 1
    }

    if (normalizedOrder === -1) {
        records.reverse()
    }

    const accountResolver = new AccountAddressJSONResolver(network)
    accountResolver.map(records, 'account')

    await accountResolver.fetchAll()

    return preparePagedData(basePath, {sort, order: normalizedOrder, cursor, limit: q.limit}, records)
}

async function queryLiquidityPoolPosition(network, pool, account) {
    validateNetwork(network)
    validatePoolId(pool)
    validateAccountAddress(account)

    const poolId = await resolveLiquidityPoolId(network, pool)
    if (poolId === null) throw errors.notFound()

    const accountId = await resolveAccountId(network, account)

    const entry = await db[network].collection('liquidity_pool_stakes')
        .findOne({
                account: accountId,
                pool: poolId
            },
            {
                projection: {
                    _id: 0,
                    stake: 1
                }
            })

    let [position, total] = await Promise.all([
        db[network].collection('liquidity_pool_stakes').countDocuments({pool: poolId, stake: {$gt: entry.stake}}),
        db[network].collection('liquidity_pool_stakes').countDocuments({pool: poolId, stake: {$gt: 0}})
    ])
    position++

    if (!entry) throw errors.notFound()
    return {account, asset: pool, total, position, ...entry}
}

module.exports = {queryLiquidityPoolHolders, queryLiquidityPoolPosition}