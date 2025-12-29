const config = require('../../app.config')
const db = require('../../connectors/mongodb-connector')
const ShardedElasticQuery = require('../../connectors/sharded-elastic-query')
const {parseDate} = require('../../utils/date-utils')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {
    validateNetwork,
    validateAssetName,
    validateAccountAddress,
    validateOfferId,
    validatePoolId
} = require('../validators')
const errors = require('../errors')

async function queryTradesList(network, queryFilter, basePath, {ts, order, cursor, limit}) {
    validateNetwork(network)
    order = normalizeOrder(order, -1) === 1 ? 'asc' : 'desc'
    limit = normalizeLimit(limit, 20, 200)
    const elasticQuery = new ShardedElasticQuery(network, 'tradeIndex')

    if (ts) {
        const timestamp = parseDate(ts)
        const id = BigInt(timestamp) << 32n
        queryFilter.push({range: {id: {lt: id}}})
    }

    if (cursor) {
        //TODO: automatically determine min/max year based on cursor
        queryFilter.push({range: {id: {[order === 'asc' ? '$gt' : '$lt']: cursor}}})
    }
    let rows = await elasticQuery.search({
        filter: queryFilter,
        limit,
        order,
        sort: 'id'
    })

    rows = rows.map(({_source}) => {
        const {id, op, ts, offer, pool, account, asset, amount} = _source
        return {
            id: id,
            ts,
            operation: op,
            offer,
            pool,
            seller: pool ? undefined : account[1],
            sold_asset: asset[1],
            sold_amount: amount[1],
            buyer: account[0],
            bought_asset: asset[0],
            bought_amount: amount[0],
            price: parseFloat(amount[0]) / parseFloat(amount[1]),
            paging_token: id
        }
    })
    return preparePagedData(basePath, {order, cursor, limit}, rows)
}

async function queryAssetTrades(network, asset, basePath, query) {
    validateNetwork(network)
    asset = validateAssetName(asset)
    const assetInfo = await db[network].collection('assets').findOne({_id: asset}, {projection: {_id: 1}})
    if (!assetInfo)
        throw errors.notFound('Asset was not found on the ledger. Check if you specified the asset identifier correctly.')
    const filter = [{term: {asset}}]
    return await queryTradesList(network, filter, basePath, query)
}

async function queryAccountTrades(network, account, basePath, query) {
    validateNetwork(network)
    validateAccountAddress(account)
    const accountInfo = await db[network].collection('accounts').findOne({_id: account}, {projection: {_id: 1}})
    if (!accountInfo)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')
    const filter = [{term: {account}}]
    return await queryTradesList(network, filter, basePath, query)
}

async function queryOfferTrades(network, offer, basePath, query) {
    validateNetwork(network)
    validateOfferId(offer)
    const filter = [{term: {offer}}]
    return await queryTradesList(network, filter, basePath, query)
}

async function queryPoolTrades(network, pool, basePath, query) {
    validateNetwork(network)
    pool = validatePoolId(pool)
    const lpInfo = await db[network].collection('liquidity_pools').findOne({_id: pool}, {projection: {_id: 1}})
    if (!lpInfo)
        throw errors.notFound('Liquidity pool was not found on the ledger.')
    const filter = [{term: {pool}}]
    return await queryTradesList(network, filter, basePath, query)
}

module.exports = {
    queryAssetTrades,
    queryAccountTrades,
    queryOfferTrades,
    queryPoolTrades
}