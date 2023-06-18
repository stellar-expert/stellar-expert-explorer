const {Long} = require('mongodb')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {unixNow, timeUnits} = require('../../utils/date-utils')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {resolveAccountAddress} = require('./account-resolver')
const {encodeBsonId} = require('../../utils/bson-id-encoder')

function rangeActivity(index, multiplier = 1) {
    if (index > multiplier * 1000) return 'very high'
    if (index > multiplier * 100) return 'high'
    if (index > multiplier * 10) return 'moderate'
    if (index > 0) return 'low'
    return 'none'
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
        const [activity, assets] = await Promise.all([fetchActivity(network, account._id), fetchAssets(network, account._id)])
        res.activity = {
            yearly: rangeActivity(activity.year, 5),
            monthly: rangeActivity(activity.month, 1)
        }

        res.assets = assets
    } else {
        res.activity = {
            yearly: 'none',
            monthly: 'none'
        }
    }

    await assetResolver.fetchAll()
    return res
}

async function fetchAssets(network, accountId) {
    const assets = await db[network]
        .collection('trustlines_history').aggregate([
            {
                $match: {
                    _id: {
                        $gte: encodeBsonId(accountId, 0, 0),
                        $lt: encodeBsonId(accountId + 1, 0, 0)
                    }
                }
            },
            {
                $group: {
                    _id: '$asset'
                }
            },
            {
                $lookup: {
                    from: 'assets',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'asset'
                }
            },
            {
                $unwind: {
                    path: '$asset'
                }
            },
            {
                $project: {
                    _id: 0,
                    asset: '$asset.name'
                }
            }
        ]).toArray()
    return assets.map(a => a.asset)
}

async function fetchActivity(network, accountId) {
    const now = unixNow()
    const activity = await db[network]
        .collection('account_history').aggregate([
            {
                $match: {
                    _id: {
                        $gte: new Long(now - timeUnits.month * 12, accountId),
                        $lt: new Long(0, accountId + 1)
                    }
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
                                    $gte: ['$_id', new Long(now - timeUnits.month, accountId)]
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
        ]).toArray()
    return activity[0] || {year: 0, month: 0}
}

module.exports = {queryAccountStats}