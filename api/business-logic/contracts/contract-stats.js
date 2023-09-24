const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validateContractAddress} = require('../validators')
const {resolveAccountAddress} = require('../account/account-resolver')
const AssetDescriptor = require('../asset/asset-descriptor')

async function queryContractStats(network, contractAddress) {
    validateNetwork(network)
    validateContractAddress(contractAddress)

    const contract = await db[network]
        .collection('contracts')
        .findOne({address: contractAddress})
    if (!contract)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')

    const res = {
        account: contract.address,
        created: contract.created,
        creator: await resolveAccountAddress(network, contract.creator),
        payments: contract.payments,
        trades: contract.trades
    }
    if (contract.wasm) {
        res.wasm = contract.wasm.toString('hex')
    }
    if (contract.issuer) {
        const issuerAddress = await resolveAccountAddress(network, contract.issuer)
        if (contract.code) {
            res.asset = new AssetDescriptor(contract.code + '-' + issuerAddress).toFQAN()
        } else {
            res.issuer = issuerAddress
            res.salt = contract.salt?.toString()
        }
    }

    if (await db[network].collection('assets').findOne({name: contractAddress}, {projection: {_id: 1}})) {
        res.isAsset = true
    }

    return res
}

module.exports = {queryContractStats}