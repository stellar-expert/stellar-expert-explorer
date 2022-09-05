const db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {normalizeOrder, preparePagedData, addPagingToken, calculateSequenceOffset} = require('../api-helpers'),
    {resolveAccountId} = require('../account/account-resolver'),
    {validateNetwork, isValidAccountAddress} = require('../validators')

const supportedFeaturesSearch = [{
    terms: ['SEP3', 'SEP0003', 'SEP-0003', 'AUTH_SERVER'],
    filter: 'sep3'
}, {
    terms: ['SEP6', 'SEP0006', 'SEP-0006', 'SEP24', 'SEP0024', 'SEP-0024', 'TRANSFER_SERVER'],
    filter: 'sep6'
}, {
    terms: ['SEP10', 'SEP0010', 'SEP-0010', 'WEB_AUTH_ENDPOINT'],
    filter: 'sep10'
}, {
    terms: ['SEP12', 'SEP0012', 'SEP-0012', 'KYC_SERVER'],
    filter: 'sep12'
}, {
    terms: ['SEP24', 'SEP0024', 'SEP-0024', 'TRANSFER_SERVER_SEP0024'],
    filter: 'sep24'
}, {
    terms: ['SEP31', 'SEP0031', 'SEP-0031', 'DIRECT_PAYMENT_SERVER'],
    filter: 'sep31'
}]

async function queryAllAssets(network, basePath, {search, sort, order, cursor, limit, skip}) {
    validateNetwork(network)

    const q = new QueryBuilder({asset: {$ne: 0}, payments: {$gt: 0}})
        .setSkip(calculateSequenceOffset(skip, limit, cursor, order))
        .setLimit(limit, 50)

    let sortOrder
    //order is ignored for assets rating
    switch (sort) {
        case 'created':
            sortOrder = {'created': 1}
            break
        case 'payments':
            sortOrder = {'payments': -1}
            break
        case 'trades':
            sortOrder = {'trades': -1}
            break
        case 'trustlines':
            sortOrder = {'trustlines.total': -1}
            break
        case 'volume':
            sortOrder = {'volume': -1}
            break
        case 'volume7d':
            sortOrder = {'volume7d': -1}
            break
        case 'rating':
        default:
            sortOrder = {'rating.average': -1}
            break
    }
    sortOrder._id = 1

    const projection = {
        _id: 0,
        name: 1,
        created: 1,
        trades: 1,
        tradedAmount: 1,
        payments: 1,
        paymentsAmount: 1,
        supply: 1,
        trustlines: 1,
        price: 1,
        volume: 1,
        volume7d: 1,
        price7d: 1,
        rating: 1,
        domain: 1,
        tomlInfo: 1
    }

    search = (search || '').trim() //cleanup spaces
    let assets,
        isTextSearch = false
    if (search) {
        //check whether search is an account address
        if (isValidAccountAddress(search)) {
            const issuer = await resolveAccountId(network, search)
            if (!issuer)
                return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, [])
            q.addQueryFilter({issuer})
        } else {
            //check if it's a search by features
            const asFeatureName = search.toUpperCase(),
                supportedFeature = supportedFeaturesSearch.find(f => f.terms.includes(asFeatureName))
            if (supportedFeature) {
                q.addQueryFilter({features: supportedFeature.filter})

            } else {//full-text search by asset properties
                q.addQueryFilter({$text: {$search: search.trim()}})
                isTextSearch = true
            }
        }
    }
    if (isTextSearch) {
        assets = await db[network].collection('assets')
            .aggregate([
                {$match: q.query},
                {$project: {...projection, score: {$multiply: [{$ln: {$meta: 'textScore'}}, '$rating.average']}}},
                {$match: {score: {$gt: 0}}},
                {$sort: {score: -1, ...sortOrder}},
                {$skip: q.skip},
                {$limit: q.limit}
            ])
            .toArray()
    } else {
        assets = await db[network].collection('assets')
            .find(q.query)
            .project(projection)
            .sort(sortOrder)
            .skip(q.skip)
            .limit(q.limit)
            .toArray()
    }

    //remap "asset" field

    assets = assets.map(({
                             name,
                             tradedAmount,
                             paymentsAmount,
                             lastPrice,
                             price,
                             baseVolume,
                             volume,
                             quoteVolume,
                             totalTrades,
                             trades,
                             ...other
                         }) => ({
        asset: name,
        traded_amount: tradedAmount,
        payments_amount: paymentsAmount,
        trades: totalTrades,
        price: lastPrice,
        volume: quoteVolume,
        ...other
    }))

    addPagingToken(assets, q.skip)

    if (normalizeOrder(order) === 1) {
        assets.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, assets)
}

module.exports = {queryAllAssets}