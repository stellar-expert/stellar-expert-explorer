const db = require('../../connectors/mongodb-connector'),
    {resolveAccountAddress} = require('./account-resolver'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {validateNetwork, validateAccountAddress} = require('../validators'),
    dayjs = require('dayjs'),
    errors = require('../errors')

function rangeActivity(index, multiplier = 1) {
    if (index > multiplier * 1000) return 'very high'
    if (index > multiplier * 100) return 'high'
    if (index > multiplier * 10) return 'moderate'
    if (index > 0) return 'low'
    return 'zero'
}

async function queryAccountStats(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const account = await db[network]
        .collection('accounts')
        .findOne({address: accountAddress})
    if (!account)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address key correctly.')

    const assetResolver = new AssetJSONResolver(network)

    const res = {
        account: account.address,
        created: account.created,
        creator: await resolveAccountAddress(network, account.creator),
        deleted: account.deleted,
        payments: account.payments,
        trades: account.trades
    }

    if (res.payments > 0 || res.trades > 0) {
        const now = new Date()
        const activity = await db[network]
            .collection('account_history').aggregate([
                    {
                        $match: {
                            account: account._id, ts: {$gte: dayjs(now).subtract(1, 'year').unix()}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            year: {$sum: {$add: ['$payments', {$multiply: ['$trades', 0.5]}]}},
                            month: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: ['$ts', dayjs(now).subtract(1, 'month').unix()]
                                        },
                                        {
                                            $add: ['$payments', {$multiply: ['$trades', 0.5]}]
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]
            ).toArray()
        const {year = 0, month = 0} = activity[0] || {}
        res.activity = {
            yearly: rangeActivity(year, 5),
            monthly: rangeActivity(month, 1)
        }
    }

    await assetResolver.fetchAll()
    return res
}

module.exports = {queryAccountStats}