const {Asset, Networks} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const {anyToNumber} = require('../../utils/formatter')
const QueryBuilder = require('../query-builder')
const {normalizeOrder, preparePagedData, addPagingToken, calculateSequenceOffset, normalizeLimit} = require('../api-helpers')
const {resolveAccountId} = require('../account/account-resolver')
const {validateNetwork, isValidAccountAddress} = require('../validators')

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

const projection = {
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

function mapAssetProps(assets, network) {
    return assets.map(({
                           _id,
                           supply,
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
        supply: anyToNumber(supply),
        traded_amount: tradedAmount,
        payments_amount: paymentsAmount,
        trades: totalTrades,
        price: lastPrice,
        volume: quoteVolume,
        ...other
    }))
}

async function queryAllAssets(network, basePath, {search, sort, order, cursor, limit, includeUninitialized}) {
    validateNetwork(network)
    limit = normalizeLimit(limit, 50)
    if (sort === 'created')
        return await queryAllAssetsByCreatedDate(network, basePath, cursor, limit, order, includeUninitialized)

    const q = new QueryBuilder({payments: {$gt: 0}})
        .setSkip(calculateSequenceOffset(0, limit, cursor, order))
        .setLimit(limit, 50)

    let sortOrder
    //order is ignored for assets rating
    switch (sort) {
        case 'payments':
            sortOrder = {'payments': -1}
            break
        case 'trades':
            sortOrder = {'trades': -1}
            break
        case 'trustlines':
            sortOrder = {'trustlines.0': -1}
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

    search = (search || '').trim() //cleanup spaces
    let assets
    let isTextSearch = false
    if (search) {
        //check whether search is an account address
        if (isValidAccountAddress(search)) {
            const issuer = await resolveAccountId(network, search)
            if (!issuer)
                return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, [])
            q.addQueryFilter({issuer})
        } else {
            //check if it's a search by features
            const asFeatureName = search.toUpperCase()
            const supportedFeature = supportedFeaturesSearch.find(f => f.terms.includes(asFeatureName))
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
            .sort(sortOrder)
            .skip(q.skip)
            .limit(q.limit)
            .project(projection)
            .toArray()
    }

    assets = mapAssetProps(assets, network)

    addPagingToken(assets, q.skip)

    if (normalizeOrder(order) === 1) {
        assets.reverse()
    }

    return preparePagedData(basePath, {sort, order, cursor: q.skip, limit: q.limit}, assets)
}

async function queryAllAssetsByCreatedDate(network, basePath, cursor, limit, order, includeUninitialized = false) {
    order = normalizeOrder(order)
    const q = new QueryBuilder(includeUninitialized ? {} : {payments: {$gt: 0}})
        .setSort('_id', order, -1)
        .setLimit(limit, 50)

    const idCursor = parseInt(cursor, 10)
    if (idCursor) {
        q.query = {_id: {[order === 1 ? '$gt' : '$lt']: idCursor}, ...q.query}
    }

    let assets = await db[network].collection('assets')
        .find(q.query)
        .limit(q.limit)
        .sort(q.sort)
        .project(projection)
        .toArray()

    for (const a of assets) {
        a.paging_token = a._id
    }
    assets = mapAssetProps(assets, network)

    return preparePagedData(basePath, {sort: 'created', order, cursor: q.skip, limit: q.limit}, assets)
}

async function querySAL(network, limit = 50) {
    const assets = await db[network].collection('assets')
        .find({})
        .sort({'rating.average': -1})
        .skip(1)
        .limit(limit)
        .project({name: 1, tomlInfo: 1, domain: 1})
        .toArray()

    return {
        name: 'StellarExpert Top 50',
        provider: 'StellarExpert',
        description: 'Dynamically generated list based on technical asset metrics, including payments and trading volumes, interoperability, userbase, etc. Assets included in this list were not verified by StellarExpert team. StellarExpert is not affiliated with issuers, and does not endorse or advertise assets in the list. Assets reported for fraudulent activity removed from the list automatically.',
        version: '1.0',
        network,
        feedback: 'https://stellar.expert',
        assets: assets.map(a => {
            if (a.name.length === 56 && a.name[0] === 'C') { //wasm contract
                return {
                    contract: a.name,
                    name: cleanupString(a.tomlInfo?.name || a.name),
                    org: cleanupString(a.tomlInfo?.orgName || 'unknown'),
                    domain: a.domain || undefined,
                    icon: a.tomlInfo?.image || undefined
                }
            } else {
                const [code, issuer] = a.name.split('-')
                return {
                    code,
                    issuer,
                    contract: new Asset(code, issuer).contractId(Networks[network.toUpperCase()]),
                    name: cleanupString(a.tomlInfo?.name || code),
                    org: cleanupString(a.tomlInfo?.orgName || 'unknown'),
                    domain: a.domain || undefined,
                    icon: a.tomlInfo?.image || undefined,
                    decimals: 7
                }
            }
        })
    }
}

function cleanupString(value) {
    if (!value)
        return undefined
    return value.replace(/[^\w\u0020.,-@]*/g, '')
}

module.exports = {queryAllAssets, querySAL}