const db = require('../../connectors/mongodb-connector')

async function resolveContractId(network, contractAddress) {
    const contract = await db[network]
        .collection('contracts')
        .findOne({address: contractAddress}, {projection: {_id: 1}})
    if (!contract)
        return null
    return contract._id
}

async function resolveContractAddress(network, contractId) {
    const contract = await db[network]
        .collection('contracts')
        .findOne({_id: contractId}, {projection: {address: 1}})
    if (!contract)
        return null
    return contract.address
}

module.exports = {resolveContractId, resolveContractAddress}