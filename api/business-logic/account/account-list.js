const {StrKey} = require('stellar-sdk'),
    db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {validateNetwork} = require('../validators'),
    errors = require('../errors'),
    {addPagingToken, calculateSequenceOffset, preparePagedData} = require('../api-helpers')

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
                account: account.address,
                created: account.created,
                deleted: account.deleted,
                payments: account.payments,
                trades: account.trades
            }]
        }
        return preparePagedData(basePath, {sort: 'natural', order: 'asc', cursor: 0, limit}, batch)
    } else {
        const q = new QueryBuilder({$text: {$search: search.trim()}})
            .setSkip(calculateSequenceOffset(skip, limit, cursor, 'asc'))
            .setLimit(limit, 20)

        q.addQueryFilter({})
        //score should have the highest priority
        const sortOrder = {score: {$meta: 'textScore'}}
        const directoryEntries = await db['public'].collection('directory')
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
            account.account = account.address
            delete account.address
            return account
        })
        addPagingToken(res, q.skip)
        return preparePagedData(basePath, {sort: 'natural', order: 'asc', cursor: q.skip, limit: q.limit}, res)
    }
}

module.exports = {queryAllAccounts}