const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {validateNetwork} = require('../validators')
const errors = require('../errors')
const {addPagingToken, calculateSequenceOffset, preparePagedData} = require('../api-helpers')
const {aggregateAccountHistory} = require('./account-stats-history')

const accountProjectedFields = {
    created: 1,
    deleted: 1,
    history: 1
}

async function queryAllAccounts(network, basePath, {search, cursor, limit, skip}) {
    validateNetwork(network)

    if (!search)
        throw errors.notFound()

    if (StrKey.isValidEd25519PublicKey(search)) {
        const account = await db[network]
            .collection('accounts')
            .findOne({_id: search}, {projection: accountProjectedFields})
        let batch
        if (!account) {
            batch = []
        } else {
            batch = [prepare(account)]
        }
        return preparePagedData(basePath, {sort: 'address', order: 'asc', cursor: 0, limit}, batch)
    }

    if (skip > 1000) {
        skip = 1000
    }
    const q = new QueryBuilder({$text: {$search: search.trim()}})
        .setSkip(calculateSequenceOffset(skip, limit, cursor, 'asc'))
        .setLimit(limit, 20)

    q.addQueryFilter({})
    //score should have the highest priority
    const sortOrder = {score: {$meta: 'textScore'}}
    const directoryEntries = await db.public.collection('directory')
        .find(q.query)
        .sort(sortOrder)
        .skip(q.skip)
        .limit(q.limit)
        .project({_id: 1})
        .toArray()

    const idsToSearch = directoryEntries.map(di => di._id)

    const accounts = await db[network].collection('accounts')
        .find({_id: {$in: idsToSearch}})
        .project(accountProjectedFields)
        .toArray()

    const res = idsToSearch.map(d => {
        let account = accounts.find(a => a._id === d)
        if (!account) {
            account = {address: d, deleted: true, payments: 0, trades: 0, created: 0}
        } else {
            account = prepare(account)
        }
        return account
    })
    addPagingToken(res, q.skip)
    return preparePagedData(basePath, {sort: 'score', order: 'asc', cursor: q.skip, limit: q.limit}, res)
}

function prepare(account) {
    const {payments, trades} = aggregateAccountHistory(account.history)
    return {
        address: account._id,
        created: account.created,
        deleted: account.deleted,
        payments,
        trades
    }
}

module.exports = {queryAllAccounts}