const {StrKey} = require('@stellar/stellar-sdk')
const {Binary} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver')
const {preparePagedData, normalizeOrder} = require('../api-helpers')
const QueryBuilder = require('../query-builder')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {aggregateEstimatedClaimableBalancesValue} = require('./claimable-balances-value-estimator')
const errors = require('../errors')

async function queryClaimableBalances(network, objectiveFilterCondition, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)

    const query = Object.assign(objectiveFilterCondition)

    const q = new QueryBuilder(query)
        .setLimit(limit)
        .setSort('uid', order)

    if (cursor) {
        q.addQueryFilter({uid: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: BigInt(cursor)}})
    }

    const records = await db[network].collection('claimable_balances')
        .find(q.query, {
            sort: q.sort,
            limit: q.limit
        })
        .toArray()

    const values = await aggregateEstimatedClaimableBalancesValue(network, records.map(r => r._id))
    const valueMap = new Map()
    for (const value of values) {
        if (value.value) {
            valueMap.set(value.id.toString('base64'), value.value)
        }
    }

    for (let record of records) {
        record.value = valueMap.get(record._id.toString('base64')) || 0
    }

    const assetResolver = new AssetJSONResolver(network)
    const accountResolver = new AccountAddressJSONResolver(network)

    const rows = records.map(cb => serializeClaimableBalance(cb, accountResolver, assetResolver))

    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll()])

    return preparePagedData(basePath, {sort, order, cursor, limit: q.limit}, rows)
}

async function loadClaimableBalance(network, id) {
    let parsedId
    try {
        if (id.startsWith('B')) {
            parsedId = new Binary(StrKey.decodeClaimableBalance(id), 0)
        } else {
            if (id.length !== 64)
                throw new Error('Invalid id')
            parsedId = Binary.createFromHexString(id, 0)
        }
    } catch (e) {
        throw errors.validationError('id', 'Invalid claimable balance id format')
    }

    const [cb] = await db[network].collection('claimable_balances')
        .find({_id: parsedId})
        .toArray()
    if (!cb)
        throw new errors.notFound()

    const assetResolver = new AssetJSONResolver(network)
    const accountResolver = new AccountAddressJSONResolver(network)

    const res = serializeClaimableBalance(cb, accountResolver, assetResolver)
    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll()])
    return res
}

function serializeClaimableBalance(cb, accountResolver, assetResolver) {
    const {_id, uid, created, updated, deleted, sponsor, asset, amount, claimants, cond, claimedBy, value} = cb
    const res = {
        id: _id.toString('hex'),
        address: StrKey.encodeClaimableBalance(_id.buffer),
        paging_token: uid,
        sponsor: accountResolver.resolve(sponsor),
        asset: assetResolver.resolve(asset),
        amount,
        claimants: claimants.map((claimant, i) => {
            return {
                destination: accountResolver.resolve(claimant),
                predicate: convertPredicate(cond[i])
            }
        }),
        created,
        updated
    }
    if (claimedBy) {
        res.claimedBy = accountResolver.resolve(claimedBy)
        res.claimed = deleted
    }
    if (value) {
        res.value = value
    }
    return res
}

function convertPredicate(predicate) {
    if (!predicate)
        return {unconditional: true}
    const [type] = Object.keys(predicate)
    const value = predicate[type]
    switch (type) {
        case 'a':
            return {abs_before: new Date(value * 1000).toUTCString()}
        case 'r':
            return {rel_before: new Date(value * 1000).toUTCString()}
        case '!':
            return {not: convertPredicate(value)}
        case '&':
            return {and: value.map(convertPredicate)}
        case '|':
            return {or: value.map(convertPredicate)}
        case predicate:
            return {unconditional: true}
        default:
            throw new Error(`Unknown claim condition predicate: ${type}`)
    }
}

async function queryAccountClaimableBalances(network, account, basePath, query) {
    validateNetwork(network)
    validateAccountAddress(account)
    const accountId = await resolveAccountId(network, account)
    if (!accountId)
        throw errors.notFound(`Account ${account} was not found on the network`)
    return await queryClaimableBalances(network, {'claimants': accountId}, basePath, query)
}

module.exports = {queryAccountClaimableBalances, loadClaimableBalance}