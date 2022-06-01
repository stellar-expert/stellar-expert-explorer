const db = require('../../connectors/mongodb-connector'),
    {validateNetwork} = require('../validators'),
    QueryBuilder = require('../query-builder'),
    {calculateSequenceOffset, preparePagedData, addPagingToken, normalizeOrder} = require('../api-helpers'),
    {matchPoolAssets} = require('./liquidity-pool-asset-matcher'),
    priceTracker = require('../ticker/price-tracker')

function adjustPrice(value) {
    if (!value) return 0
    return Math.round(value * priceTracker.recentPrice)
}

async function queryAllLiquidityPools(network, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)

    if (!priceTracker.initialized) {
        await priceTracker.init()
    }

    const q = new QueryBuilder({shares: {$gt: 0}})
        .setSkip(calculateSequenceOffset(0, limit, cursor, order))
        .setLimit(limit)

    let sortOrder
    //order is ignored for assets rating
    switch (sort) {
        case 'created':
            sortOrder = {'created': 1}
            break
        case 'trades':
            sortOrder = {'trades': -1}
            break
        case 'accounts':
            sortOrder = {'accounts': -1}
            break
        case 'volume1d':
            sortOrder = {'volumeValue24h': -1}
            break
        case 'volume7d':
            sortOrder = {'volumeValue7d': -1}
            break
        case 'earned1d':
            sortOrder = {'earnedValue24h': -1}
            break
        case 'earned7d':
            sortOrder = {'earnedValue7d': -1}
            break
        case 'tvl':
        default:
            sortOrder = {'tvl': -1}
            break
    }

    let pools = await db[network].collection('liquidity_pools')
        .find(q.query)
        .sort(sortOrder)
        .skip(q.skip)
        .limit(q.limit)
        .toArray()

    const poolAssets = await matchPoolAssets(network, pools)

    pools = pools.map(pool => ({
        id: pool.hash,
        assets: poolAssets.match(pool, (pa, i) => ({
            asset: pa.name,
            amount: pool.reserves[i].toString(),
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
        deleted: pool.deleted
    }))

    addPagingToken(pools, q.skip)

    if (normalizeOrder(order) === 1) {
        pools.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, pools)
}

module.exports = {queryAllLiquidityPools}