const db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {resolveAccountId} = require('./account-resolver'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {validateNetwork, validateAccountAddress} = require('../validators'),
    errors = require('../errors')

async function queryAccountStatsHistory(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const assetResolver = new AssetJSONResolver(network)

    const accountId = await resolveAccountId(network, accountAddress)
    if (!accountId)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address key correctly.')


    const q = new QueryBuilder()
        .forAccount(accountId)

    const history = await db[network].collection('account_history')
        .find(q.query)
        .sort({ts: 1})
        .toArray()

    if (!history.length)
        throw errors.notFound('Account statistics were not found on the ledger. Check if you specified the public key correctly.')

    const res = history.map(({_id, payments, trades, balances, deleted}) => ({
        ts: _id.getHighBits(),
        payments,
        trades,
        balances: Object.keys(balances).map(key => ({
            asset: assetResolver.resolve(parseInt(key)),
            balance: balances[key].toString()
        })),
        deleted: deleted ? true : undefined
    }))

    await assetResolver.fetchAll()
    return res
}

module.exports = {queryAccountStatsHistory}