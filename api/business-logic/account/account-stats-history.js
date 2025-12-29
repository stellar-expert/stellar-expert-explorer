const db = require('../../connectors/mongodb-connector')
const {timeUnits, unixNow} = require('../../utils/date-utils')
const errors = require('../errors')
const {validateNetwork, validateAccountAddress} = require('../validators')

const accountHistoryKeys = {
    payments: 0,
    trades: 1,
    active: 2,
    deleted: 3
}

async function queryAccountStatsHistory(network, accountAddress) {
    validateNetwork(network)
    validateAccountAddress(accountAddress)

    const account = await db[network].collection('account').findOne({_id: accountAddress})

    if (!account)
        throw errors.notFound('Account was not found on the ledger. Check if you specified the public key correctly.')

    return rehydrateAccountHistory(account.history)
}

function rehydrateAccountHistory(history) {
    return Object.entries(history).map(([key, value]) => ({
        ts: parseInt(key),
        payments: value[accountHistoryKeys.payments],
        trades: value[accountHistoryKeys.trades],
        deleted: value[accountHistoryKeys.deleted] ? true : undefined
    }))
}

function aggregateAccountHistory(history) {
    return rehydrateAccountHistory(history)
        .reduce((acc, {payments, trades}) => {
            acc.payments += payments
            acc.trades += trades
            return acc
        }, {payments: 0, trades: 0})
}

function evaluateActivity(history) {
    const month = timeUnits.month / timeUnits.second
    const fromYear = unixNow() - 12 * month
    const fromMonth = unixNow() - month
    const res = {year: 0, month: 0}
    for (let [ts, record] of Object.entries(history)) {
        if (ts < fromYear)
            continue
        res.year += record[accountHistoryKeys.payments] || 0
        res.year += (record[accountHistoryKeys.trades] || 0) / 2
        if (ts < fromMonth)
            continue
        res.month += record[accountHistoryKeys.payments] || 0
        res.month += (record[accountHistoryKeys.trades] || 0) / 2
    }
    return res
}

module.exports = {queryAccountStatsHistory, aggregateAccountHistory, evaluateActivity, accountHistoryKeys}