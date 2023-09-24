const errors = require('../errors')
const {validateNetwork, validateContractAddress} = require('../validators')
const {queryBalances} = require('../trustline/balances')
const {resolveAccountId} = require('../account/account-resolver')

async function queryContractBalances(network, contractAddress) {
    validateNetwork(network)
    validateContractAddress(contractAddress)

    const contractId = await resolveAccountId(network, contractAddress)
    if (contractId === null)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')

    return await queryBalances(network, contractId)
}

module.exports = {queryContractBalances}