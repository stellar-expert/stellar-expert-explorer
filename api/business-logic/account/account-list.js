const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {validateNetwork} = require('../validators')
const errors = require('../errors')
const {addPagingToken, calculateSequenceOffset, preparePagedData} = require('../api-helpers')

const accountProjectedFields = {
    address: 1,
    created: 1,
    deleted: 1,
    payments: 1,
    trades: 1,
    _id: 0
}

async function queryAllAccounts(network, basePath, {search, cursor, limit, skip}) {
    validateNetwork(network)

    if (!search)
        throw errors.notFound()

    if (StrKey.isValidEd25519PublicKey(search)) {
        const account = await db[network]
            .collection('accounts')
            .findOne({address: search}, {projection: accountProjectedFields})
        let batch
        if (!account) {
            batch = []
        } else {
            batch = [{
                address: account.address,
                created: account.created,
                deleted: account.deleted,
                payments: account.payments,
                trades: account.trades
            }]
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
        .find({address: {$in: idsToSearch}})
        .project(accountProjectedFields)
        .toArray()

    const res = idsToSearch.map(d => {
        let account = accounts.find(a => a.address === d)
        if (!account) {
            account = {address: d, deleted: true, payments: 0, trades: 0, created: 0}
        }
        return account
    })
    addPagingToken(res, q.skip)
    return preparePagedData(basePath, {sort: 'score', order: 'asc', cursor: q.skip, limit: q.limit}, res)
}

module.exports = {queryAllAccounts}