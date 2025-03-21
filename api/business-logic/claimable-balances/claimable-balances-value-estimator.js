const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork} = require('../validators')
const {AssetJSONResolver} = require('../asset/asset-resolver')

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

    const res = await aggregateEstimatedClaimableBalancesValue(network, bids)

    const assetResolver = new AssetJSONResolver(network)
    for (const cb of res) {
        cb.asset = assetResolver.resolve(cb.asset)
    }

    await assetResolver.fetchAll()
    return {
        claimable_balances: res,
        total: res.reduce((prev, current) => prev + current.value, 0),
        currency
    }
}

async function aggregateEstimatedClaimableBalancesValue(network, bids) {
    return await db[network].collection('claimable_balances').aggregate([
        {
            $match: {_id: {$in: bids}}
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'asset',
                foreignField: '_id',
                as: 'assetInfo'
            }
        },
        {
            $project: {
                _id: 0,
                id: '$_id',
                amount: 1,
                asset: {$first: '$assetInfo'}
            }
        },
        {
            $project: {
                id: 1,
                asset: '$asset.name',
                amount: 1,
                value: {$floor: {$multiply: ['$amount', {$ifNull: ['$asset.lastPrice', 0]}]}}
            }
        }
    ]).toArray()
}

module.exports = {estimateClaimableBalancesValue, aggregateEstimatedClaimableBalancesValue}