const {Long, ObjectId} = require('bson'),
    db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver'),
    {preparePagedData, normalizeOrder} = require('../api-helpers'),
    {validateNetwork, validateAccountAddress} = require('../validators'),
    errors = require('../errors')

async function queryAccountRelations(network, account, basePath, {order, cursor, limit}) {
    validateNetwork(network)
    validateAccountAddress(account)

    const accountId = await resolveAccountId(network, account)
    if (accountId === null)
        throw errors.validationError('account', `Account ${account} not found on the ledger`)

    const q = new QueryBuilder({accounts: accountId})
        .setLimit(limit)
        .setSort('pc', order)

    if (cursor) {
        q.addQueryFilter({pc: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: ObjectId(cursor)}})
    }

    const records = await db[network].collection('relations')
        .find(q.query, {
            sort: q.sort,
            limit: q.limit,
            skip: q.skip
        })
        .toArray()

    const accountResolver = new AccountAddressJSONResolver(network)

    const rows = records.map(({_id, accounts, type, created, updated, transfers, pc}) => ({
        id: _id,
        paging_token: pc.toString(),
        accounts: accounts.map(a => accountResolver.resolve(a)),
        type,
        transfers,
        created,
        updated
    }))

    await accountResolver.fetchAll()

    return preparePagedData(basePath, {order, cursor, limit: q.limit}, rows)
}

module.exports = {queryAccountRelations}