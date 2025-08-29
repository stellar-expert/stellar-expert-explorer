const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {parseDate} = require('../../utils/date-utils')
const {preparePagedData, normalizeOrder} = require('../api-helpers')
const {resolveAssetId, AssetJSONResolver} = require('../asset/asset-resolver')
const {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver')
const {validateNetwork, validateAssetName, validateAccountAddress, validateOfferId, validatePoolId} = require('../validators')
const {LiquidityPoolJSONResolver, resolveLiquidityPoolId} = require('../liquidity-pool/liquidity-pool-resolver')
const errors = require('../errors')

function buildHintPredicate(objectiveFilterCondition) {
    const res = {}
    for (const key of Object.keys(objectiveFilterCondition)) {
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

    const assetResolver = new AssetJSONResolver(network)
    const accountResolver = new AccountAddressJSONResolver(network)
    const poolResolver = new LiquidityPoolJSONResolver(network)

    rows = rows.map(({_id, operation, offerId, poolId, account, asset, amount}) => {
        return {
            id: _id,
            paging_token: _id,
            ts: _id.getHighBits(),
            operation,
            offer: offerId,
            pool: poolResolver.resolve(poolId),
            seller: poolId ? undefined : accountResolver.resolve(account[1]),
            sold_asset: assetResolver.resolve(asset[1]),
            sold_amount: amount[1],
            buyer: accountResolver.resolve(account[0]),
            bought_asset: assetResolver.resolve(asset[0]),
            bought_amount: amount[0],
            price: amount[0].toNumber() / amount[1].toNumber()
        }
    })
    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll(), poolResolver.fetchAll()])

    return preparePagedData(basePath, {order, cursor, skip: q.skip, limit: q.limit}, rows)
}

async function queryAssetTrades(network, asset, basePath, query) {
    validateNetwork(network)
    validateAssetName(asset)
    const assetId = await resolveAssetId(network, asset)
    if (assetId === null)
        throw errors.notFound('Asset was not found on the ledger. Unknown asset: ' + asset)

    const q = new QueryBuilder().forAsset(assetId)
    return await queryTradesList(network, q.query, basePath, query)
}

async function queryAccountTrades(network, account, basePath, query) {
    validateNetwork(network)
    validateAccountAddress(account)
    const accountId = await resolveAccountId(network, account)
    if (accountId === null)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

    const q = new QueryBuilder().forAccount(accountId)
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
    const liquidityPoolId = await resolveLiquidityPoolId(network, poolId)
    if (liquidityPoolId === null)
        throw errors.notFound('Liquidity pool was not found on the ledger.')

    const q = new QueryBuilder().forPool(liquidityPoolId)
    return await queryTradesList(network, q.query, basePath, query)
}

module.exports = {
    queryAssetTrades,
    queryAccountTrades,
    queryOfferTrades,
    queryPoolTrades
}