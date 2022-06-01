const db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {validateNetwork, validateAccountAddress} = require('../validators'),
    errors = require('../errors')

async function queryAccountBalanceHistory(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const account = await db[network]
        .collection('accounts')
        .findOne({address: accountAddress})
    if (!account)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address key correctly.')

    const assetResolver = new AssetJSONResolver(network)

    const q = new QueryBuilder()
        .forAccount(account._id)

    const history = await db[network].collection('account_history')
        .find(q.query)
        .sort({_id: 1})
        .project({balances: 1})
        .toArray()

    if (!history.length)
        throw errors.notFound('Account statistics were not found on the ledger. Check if you specified the public key correctly.')

    const res = history.map(({_id, balances}) => ({
        ts: _id.getHighBits(),
        balances: Object.keys(balances).map(key => ({
            asset: assetResolver.resolve(parseInt(key)),
            balance: balances[key].toString()
        }))
    }))

    await assetResolver.fetchAll()
    return res
}

module.exports = {queryAccountBalanceHistory}