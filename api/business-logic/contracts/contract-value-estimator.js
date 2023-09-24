const errors = require('../errors')
const {validateNetwork, validateContractAddress} = require('../validators')
const {resolveAccountId} = require('../account/account-resolver')
const {estimateTrustlinesValue} = require('../account/account-trustlines-value')

async function estimateContractValue(network, contract, currency = 'USD') {
    validateNetwork(network)
    validateContractAddress(contract)

    const accountId = await resolveAccountId(network, contract)
    if (!accountId)
        throw errors.notFound(`Account ${contract} was not found on the network`)
    const trustlines = await estimateTrustlinesValue(network, accountId)

    return {
        account: contract,
        trustlines,
        total: trustlines.reduce((prev, current) => {
            let {value} = current
            if (typeof value !== 'number') {
                if (value.isZero())
                    return prev
                value = value.toNumber()
            }
            if (!(value > 0))
                return prev
            return prev + value
        }, 0),
        currency
    }
}

module.exports = {estimateContractValue}