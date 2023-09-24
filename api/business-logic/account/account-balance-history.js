const db = require('../../connectors/mongodb-connector')
const {resolveAssetId} = require('../asset/asset-resolver')
const {validateNetwork, validateAccountAddress, validateAssetName} = require('../validators')
const {encodeBsonId, decodeBsonIdPart} = require('../../utils/bson-id-encoder')
const errors = require('../errors')

async function queryAccountBalanceHistory(network, accountAddress, asset) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)
    validateAssetName(asset)

    const account = await db[network]
        .collection('accounts')
        .findOne({address: accountAddress}, {projection: {_id: 1}})
    if (!account)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

    const assetId = await resolveAssetId(network, asset)

    const from = encodeBsonId(account._id, assetId, 0)
    const to = encodeBsonId(account._id, assetId + 1, 0)

    const history = await db[network].collection('trustlines_history')
        .find({_id: {$gt: from, $lt: to}})
        .sort({_id: -1})
        .project({balance: 1, max: 1})
        .toArray()

    if (!history.length)
        throw errors.notFound('Account balance history was not found on the ledger. Check if you specified account address and asset identifier correctly.')

    const res = history.map((r, i) => prepareRecord(r, i === 0))
    return res
}

function prepareRecord({_id, balance, max}, lastValue) {
    const ts = decodeBsonIdPart(_id, 2)
    const value = !lastValue ? (max || balance) : (balance || max)
    return [ts, value.toString()]
}

module.exports = {queryAccountBalanceHistory}