const db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver'),
    {preparePagedData, normalizeOrder} = require('../api-helpers'),
    {validateNetwork, validateAccountAddress} = require('../validators')

async function queryClaimableBalances(network, objectiveFilterCondition, basePath, {sort, order, cursor, limit, skip}) {
    validateNetwork(network)

    const query = Object.assign(objectiveFilterCondition)

    const q = new QueryBuilder(query)
        .setLimit(limit)
        .setSkip(skip)
        .setSort('created', order)

    if (cursor) {
        q.addQueryFilter({created: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: parseInt(cursor)}})
    }

    const records = await db[network].collection('claimable_balances')
        .find(q.query, {
            sort: q.sort,
            limit: q.limit,
            skip: q.skip
        })
        .toArray()

    const assetResolver = new AssetJSONResolver(network),
        accountResolver = new AccountAddressJSONResolver(network)

    const rows = records.map(({_id, created, updated, deleted, sponsor, asset, amount, claimants, claimedBy}) => {
        const res = {
            id: _id,
            paging_token: created,
            sponsor: accountResolver.resolve(sponsor),
            asset: assetResolver.resolve(asset),
            amount,
            claimants: claimants.map(claimant => {
                claimant.destination = accountResolver.resolve(claimant.destination)
                return claimant
            }),
            created,
            updated
        }
        if (claimedBy) {
            res.claimedBy = accountResolver.resolve(claimedBy)
            res.claimed = deleted
        }
        return res
    })

    await Promise.all([assetResolver.fetchAll(), accountResolver.fetchAll()])

    return preparePagedData(basePath, {sort, order, cursor, skip: q.skip, limit: q.limit}, rows)
}

async function queryAccountClaimableBalances(network, account, basePath, query) {
    validateNetwork(network)
    validateAccountAddress(account)
    const accountId = await resolveAccountId(network, account)
    return await queryClaimableBalances(network, {'claimants.destination': accountId}, basePath, query)
}

module.exports = {
    queryAccountClaimableBalances
}