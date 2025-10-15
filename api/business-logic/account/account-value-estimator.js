const errors = require('../errors')
const {validateAccountAddress, validateNetwork} = require('../validators')
const {resolveAccountId} = require('./account-resolver')
const {estimateTrustlinesValue} = require('./account-trustlines-value')
const {estimateLiquidityStakesValue} = require('./account-liquidity-stakes-value')

async function estimateAccountValue(network, account, currency = 'USD', ts = undefined) {
    validateNetwork(network)
    validateAccountAddress(account)
    if (ts) {
        ts = parseInt(ts, 10)
        if (ts < 0 || ts >= 4294967296) {
            ts = undefined
        }
    }

    const accountId = await resolveAccountId(network, account)
    if (!accountId)
        throw errors.notFound(`Account ${account} was not found on the network`)
    const [trustlines, pool_stakes] = await Promise.all([
        estimateTrustlinesValue(network, accountId, ts),
        estimateLiquidityStakesValue(network, accountId)
    ])

    return {
        account,
        trustlines,
        pool_stakes,
        total: trustlines.concat(pool_stakes).reduce((prev, current) => {
            let {value} = current
            if (typeof value !== 'number') {
                if (value === '0' || !value || value.isZero())
                    return prev
                value = value.toBigInt()
            } else {
                value = BigInt(value)
            }
            if (!(value > 0n))
                return prev
            return prev + value
        }, 0n),
        currency
    }
}

module.exports = {estimateAccountValue}