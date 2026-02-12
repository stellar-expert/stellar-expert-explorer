const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {countContractStateEntries} = require('../contract-state/contract-state-query')
const {fetchBalances} = require('../balance/balances')
const {validateNetwork, validateAccountAddress} = require('../validators')
const {aggregateAccountHistory, evaluateActivity} = require('./account-stats-history')

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

    const account = await db[network].collection('accounts').findOne({_id: accountAddress})
    if (!account)
        throw errors.notFound('Account was not found on the ledger. Check if you specified account address correctly.')

    const res = {
        account: accountAddress,
        created: account.created,
        creator: account.creator,
        deleted: account.deleted
    }

    const {payments, trades} = aggregateAccountHistory(account.history)
    res.payments = payments
    res.trades = trades

    if (payments > 0 || trades > 0) {
        const activity = evaluateActivity(account.history)
        res.activity = {
            yearly: rangeActivity(activity.year, 5),
            monthly: rangeActivity(activity.month, 1)
        }

        res.assets = await fetchAssets(network, account._id)
    } else {
        res.activity = {
            yearly: 'none',
            monthly: 'none'
        }
    }
    const count = await countContractStateEntries(network, account._id)
    if (count > 0) {
        res.storage_entries = count
    }
    return res
}

async function fetchAssets(network, address) {
    const balances = await fetchBalances(network, {address}, {projection: {asset: 1, balance: 1}})
    return balances.sort((a, b) => {
        if (a === 'XLM')
            return -1
        const dif = Number(b.balance - a.balance)
        if (dif !== 0)
            return dif
        return a > b ? 1 : -1
    }).map(a => a.asset)
}

module.exports = {queryAccountStats}