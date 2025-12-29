const db = require('../../connectors/mongodb-connector')
const {estimateAssetPrices} = require('../asset/asset-price')
const errors = require('../errors')
const {validateNetwork} = require('../validators')

const limit = 100

async function estimateClaimableBalancesValue(network, basePath, query) {
    validateNetwork(network)
    const {balance, currency = 'USD'} = query
    if (!(balance instanceof Array))
        throw errors.validationError('balance', 'Expected an array of claimable balance identifiers to fetch.')
    if (!balance.length)
        throw errors.validationError('balance', 'No search criteria provided in request.')
    if (balance.length > limit)
        throw errors.validationError('balance', `Too many "balance" conditions. Maximum ${limit} claimable balance allowed per batch.`)

    const bids = balance.map(bid => {
        if (!/^[a-f0-9]{64}$/.test(bid))
            throw errors.validationError('balance', `Invalid claimable balance id: "${bid}".`)
        return bid
    })

    const balances = await db[network].collection('claimable_balances')
        .find({_id: {$in: bids}}, {projection: {_id: 1, asset: 1}})
        .toArray()
    const res = await aggregateEstimatedClaimableBalancesValue(network, balances)

    return {
        claimable_balances: res,
        total: res.reduce((prev, current) => prev + current.value, 0),
        currency
    }
}

/**
 * @param {String} network
 * @param {{}[]} balances
 * @return {Promise<{id:String,asset:String,amount:BigInt,value:Number}[]>}
 */
async function aggregateEstimatedClaimableBalancesValue(network, balances) {
    const prices = await estimateAssetPrices(network, balances.map(b => b.asset))
    return balances.map(cb => {
        const price = prices.get(cb.asset) || 0
        return {
            id: cb._id,
            asset: cb.asset,
            amount: cb.amount,
            value: Math.floor(Number(cb.amount) * price)
        }
    })
}

module.exports = {estimateClaimableBalancesValue, aggregateEstimatedClaimableBalancesValue}