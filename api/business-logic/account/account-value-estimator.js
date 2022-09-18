const errors = require('../errors')
const {validateAccountAddress, validateNetwork} = require('../validators')
const {resolveAccountId} = require('./account-resolver')
const {estimateTrustlinesValue} = require('./account-trustlines-value')
const {estimateLiquidityStakesValue} = require('./account-liquidity-stakes-value')

async function estimateAccountValue(network, account, currency = 'USD') {
    validateNetwork(network)
    validateAccountAddress(account)

    const accountId = await resolveAccountId(network, account)
    if (!accountId)
        throw errors.notFound(`Account ${account} was not found on the network`)
    const [trustlines, pool_stakes] = await Promise.all([
        estimateTrustlinesValue(network, accountId),
        estimateLiquidityStakesValue(network, accountId)
    ])

    return {
        account,
        trustlines,
        pool_stakes,
        total: trustlines.concat(pool_stakes).reduce((prev, current) => prev + current.value, 0),
        currency
    }
}

module.exports = {estimateAccountValue}