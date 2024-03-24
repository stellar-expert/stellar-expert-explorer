const {Long} = require('mongodb')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {unixNow, timeUnits} = require('../../utils/date-utils')
const {encodeBsonId} = require('../../utils/bson-id-encoder')
const {countContractData} = require('../contract-data/contract-data-query')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {resolveAccountAddress} = require('./account-resolver')

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
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

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
    const count = await countContractData(network, account._id)
    if (count > 0) {
        res.storage_entries = count
    }
    return res
}

async function fetchAssets(network, accountId) {
    const assets = await db[network]
        .collection('trustlines_history').aggregate([
            {
                $match: {
                    _id: {
                        $gte: encodeBsonId(accountId, 1, 0), //skip XLM trustlines
                        $lt: encodeBsonId(accountId + 1, 0, 0)
                    }
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $group: {
                    _id: '$asset',
                    balance: {$first: '$balance'}
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
                    asset: '$asset.name',
                    balance: '$balance'
                }
            },
            {
                $sort: {
                    balance: -1,
                    asset: 1
                }
            }
        ]).toArray()
    const res = assets.map(a => a.asset)
    res.unshift('XLM')
    return res
}

async function fetchActivity(network, accountId) {
    const now = unixNow()
    const activity = await db[network]
        .collection('account_history').aggregate([
            {
                $match: {
                    _id: {
                        $gte: new Long(now - (timeUnits.month * 12) / 1000, accountId),
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
                                    $gte: ['$_id', new Long(now - timeUnits.month / 1000, accountId)]
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