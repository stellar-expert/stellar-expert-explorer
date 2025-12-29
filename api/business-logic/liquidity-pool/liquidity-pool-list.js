const db = require('../../connectors/mongodb-connector')
const {unixNow} = require('../../utils/date-utils')
const QueryBuilder = require('../query-builder')
const {validateNetwork, validateAssetName} = require('../validators')
const {calculateSequenceOffset, preparePagedData, addPagingToken, normalizeOrder} = require('../api-helpers')
const {matchPoolAssets} = require('./liquidity-pool-asset-matcher')
const {loadDailyOhlcPrices} = require('../dex/ohlcvt-aggregator')
const {preparePoolStatsResponse} = require('./liquidity-pool-stats')

async function queryAllLiquidityPools(network, basePath, {asset, sort, order, cursor, limit}) {
    validateNetwork(network)
    const query = {accounts: {$gt: 0}}
    if (asset) {
        query.asset = validateAssetName(asset)
    }
    const q = new QueryBuilder(query)
        .setSkip(calculateSequenceOffset(0, limit, cursor, order))
        .setLimit(limit)

    let sortOrder
    //order is ignored for assets rating
    switch (sort) {
        case 'created':
            sortOrder = {'created': 1}
            break
        case 'accounts':
        default:
            sortOrder = {'accounts': -1}
            break
    }

    let pools = await db[network].collection('liquidity_pools')
        .find(q.query)
        .sort(sortOrder)
        .skip(q.skip)
        .limit(q.limit)
        .toArray()

    const poolAssets = await matchPoolAssets(network, pools)
    const uniqueAssets = Array.from(new Set(pools.map(pool => pool.asset).flat()))
    const prices = await loadDailyOhlcPrices(network, 'asset_ohlcvt', {$in: uniqueAssets}, unixNow() - 10 * 24 * 60 * 60)

    pools = pools.map(pool => preparePoolStatsResponse(pool, poolAssets, prices))

    addPagingToken(pools, q.skip)

    if (normalizeOrder(order) === 1) {
        pools.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, pools)
}


module.exports = {queryAllLiquidityPools}