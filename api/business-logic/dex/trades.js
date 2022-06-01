const db = require('../../connectors/mongodb-connector'),
    {Long} = require('bson'),
    QueryBuilder = require('../query-builder'),
    {preparePagedData, normalizeOrder} = require('../api-helpers'),
    {resolveAssetId, AssetJSONResolver} = require('../asset/asset-resolver'),
    {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver'),
    {validateNetwork, validateAssetName, validateAccountAddress, validateOfferId, validatePoolId} = require('../validators'),
    {parseDate} = require('../../utils/date-utils'),
    {LiquidityPoolJSONResolver, resolveLiquidityPoolId} = require('../liquidity-pool/liquidity-pool-resolver')

function buildHintPredicate(objectiveFilterCondition) {
    const res = {}
    for (let key in objectiveFilterCondition) {
        res[key] = 1
    }
    //enforce only for specific indexes
    if (res.account === undefined && res.asset === undefined) return undefined
    return Object.assign(res, {_id: -1})
}

async function queryTradesList(network, queryFilter, basePath, {ts, order, cursor, limit, skip}) {
    validateNetwork(network)
    const hint = buildHintPredicate(queryFilter)
    if (ts) {
        const timestamp = parseDate(ts)
        queryFilter._id = {$lt: new Long(0, timestamp)}
    }

    const q = new QueryBuilder(queryFilter)
        .setBefore(ts)
        .setLimit(limit)
        .setSkip(skip)
        .setSort('_id', order)

    if (cursor) {
        q.addQueryFilter({_id: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: Long.fromString(cursor)}})
    }

    let rows = await db[network].collection('trades')
        .find(q.query, {
            sort: q.sort,
            limit: q.limit,
            skip: q.skip,
            hint
        })
        .toArray()

    const assetResolver = new AssetJSONResolver(network),
        accountResolver = new AccountAddressJSONResolver(network),
        poolResolver = new LiquidityPoolJSONResolver(network)

    rows = rows.map(({_id, operation, offerId, poolId, account, asset, amount}) => {
        return {
            id: _id,
            paging_token: _id,
            ts: _id.getHighBits(),
            operation: operation,
            offer: offerId,
            pool: poolResolver.resolve(poolId),
            seller: poolId ? undefined : accountResolver.resolve(account[0]),
            sold_asset: assetResolver.resolve(asset[0]),
            sold_amount: amount[0],
            buyer: accountResolver.resolve(account[poolId ? 0 : 1]),
            bought_asset: assetResolver.resolve(asset[1]),
            bought_amount: amount[1],
            price: amount[1].toNumber() / amount[0].toNumber()
        }
    })
    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll(), poolResolver.fetchAll()])

    return preparePagedData(basePath, {order, cursor, skip: q.skip, limit: q.limit}, rows)
}

async function queryAssetTrades(network, asset, basePath, query) {
    validateNetwork(network)
    validateAssetName(asset)
    const q = new QueryBuilder().forAsset(await resolveAssetId(network, asset))
    return await queryTradesList(network, q.query, basePath, query)
}

async function queryAccountTrades(network, account, basePath, query) {
    validateNetwork(network)
    validateAccountAddress(account)
    const q = new QueryBuilder().forAccount(await resolveAccountId(network, account))
    return await queryTradesList(network, q.query, basePath, query)
}

async function queryOfferTrades(network, offerId, basePath, query) {
    validateNetwork(network)
    validateOfferId(offerId)
    const q = new QueryBuilder().forOffer(offerId)
    return await queryTradesList(network, q.query, basePath, query)
}

async function queryPoolTrades(network, poolId, basePath, query) {
    validateNetwork(network)
    validatePoolId(poolId)
    const q = new QueryBuilder().forPool(await resolveLiquidityPoolId(network, poolId))
    return await queryTradesList(network, q.query, basePath, query)
}

module.exports = {
    queryAssetTrades,
    queryAccountTrades,
    queryOfferTrades,
    queryPoolTrades
}