const db = require('../../connectors/mongodb-connector')
const {resolveAssetId} = require('../asset/asset-resolver')
const {validateNetwork, validateAssetName, validateContractAddress} = require('../validators')
const {encodeBsonId, decodeBsonIdPart} = require('../../utils/bson-id-encoder')
const errors = require('../errors')

async function queryContractBalanceHistory(network, contractAddress, asset) {
    validateNetwork(network)
    validateContractAddress(contractAddress)
    validateAssetName(asset)

    const contract = await db[network]
        .collection('contracts')
        .findOne({address: contractAddress}, {projection: {_id: 1}})
    if (!contract)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')

    const assetId = await resolveAssetId(network, asset)

    const from = encodeBsonId(contract._id, assetId, 0)
    const to = encodeBsonId(contract._id, assetId + 1, 0)

    const history = await db[network].collection('trustlines_history')
        .find({_id: {$gt: from, $lt: to}})
        .sort({_id: -1})
        .project({balance: 1, max: 1})
        .toArray()

    if (!history.length)
        throw errors.notFound('Contract balance history was not found on the ledger. Check if you specified contract and asset identifier correctly.')

    return history.map((r, i) => prepareRecord(r, i === 0))
}

function prepareRecord({_id, balance, max}, lastValue) {
    const ts = decodeBsonIdPart(_id, 2)
    const value = !lastValue ? (max || balance) : (balance || max)
    return [ts, value.toString()]
}

module.exports = {queryContractBalanceHistory}