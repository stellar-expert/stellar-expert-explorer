const db = require('../../connectors/mongodb-connector')
const {preparePagedData, normalizeOrder} = require('../api-helpers')
const {validateNetwork, validateAccountAddress, validateClaimableBalanceId} = require('../validators')
const QueryBuilder = require('../query-builder')
const errors = require('../errors')
const {aggregateEstimatedClaimableBalancesValue} = require('./claimable-balances-value-estimator')

async function queryAccountClaimableBalances(network, account, basePath, {sort, order, cursor, limit}) {
    validateNetwork(network)
    validateAccountAddress(account)

    const q = new QueryBuilder({claimants: account})
        .setLimit(limit)
        .setSort('_id', order)

    if (cursor) {
        q.addQueryFilter({_id: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: cursor}})
    }

    const balances = await db[network].collection('claimable_balances')
        .find(q.query, {
            sort: q.sort,
            limit: q.limit
        }) //use maxTimeMS to avoid long-running queries
        .toArray()

    const values = await aggregateEstimatedClaimableBalancesValue(network, balances)
    const valueMap = new Map(values.map(p => [p.id, p.value]))

    for (let record of balances) {
        record.value = valueMap.get(record._id) || 0
    }

    return preparePagedData(basePath, {sort, order, cursor, limit: q.limit}, balances.map(serializeClaimableBalance))
}

async function loadClaimableBalance(network, id) {
    id = validateClaimableBalanceId(id)

    const cb = await db[network].collection('claimable_balances').findOne({_id: id})
    if (!cb)
        throw new errors.notFound()
    return serializeClaimableBalance(cb)
}

function serializeClaimableBalance(cb) {
    const id = cb._id
    const res = {
        id,
        address: id,
        paging_token: id,
        sponsor: cb.sponsor,
        asset: cb.asset,
        amount: cb.amount,
        claimants: cb.claimants.map((claimant, i) => {
            return {
                destination: claimant,
                predicate: convertPredicate(cb.cond[i])
            }
        }),
        created: cb.created,
        updated: cb.updated
    }
    if (cb.value) {
        res.value = cb.value
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
            return {abs_before: new Date(Number(value) * 1000).toUTCString()}
        case 'r':
            return {rel_before: new Date(Number(value) * 1000).toUTCString()}
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

module.exports = {queryAccountClaimableBalances, loadClaimableBalance}