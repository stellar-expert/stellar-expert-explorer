const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver')
const {preparePagedData, normalizeOrder} = require('../api-helpers')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {aggregateEstimatedClaimableBalancesValue} = require('./claimable-balances-value-estimator')

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

    const rows = records.map(({_id, uid, created, updated, deleted, sponsor, asset, amount, claimants, cond, claimedBy, value}) => {
        const res = {
            id: _id,
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
    })

    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll()])

    return preparePagedData(basePath, {sort, order, cursor, limit: q.limit}, rows)
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
    return await queryClaimableBalances(network, {'claimants': accountId}, basePath, query)
}

module.exports = {queryAccountClaimableBalances}