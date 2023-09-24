const {Long} = require('mongodb')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {resolveAccountId} = require('./account-resolver')

async function queryAccountStatsHistory(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const assetResolver = new AssetJSONResolver(network)

    const accountId = await resolveAccountId(network, accountAddress)
    if (!accountId)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

    const history = await db[network].collection('account_history')
        .find({
            _id: {
                $gte: new Long(0, accountId),
                $lt: new Long(0, accountId + 1)
            }
        })
        .sort({_id: 1})
        .toArray()

    if (!history.length)
        throw errors.notFound('Account statistics were not found on the ledger. Check if you specified the public key correctly.')

    const res = history.map(({_id, payments, trades, deleted}) => ({
        ts: _id.low,
        payments,
        trades,
        deleted: deleted ? true : undefined
    }))

    await assetResolver.fetchAll()
    return res
}

module.exports = {queryAccountStatsHistory}