const errors = require('../errors')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {queryBalances} = require('../trustline/balances')
const {resolveAccountId} = require('./account-resolver')


async function queryAccountBalances(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const accountId = await resolveAccountId(network, accountAddress)
    if (accountId === null)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

    return await queryBalances(network, accountId)
}


module.exports = {queryAccountBalances}