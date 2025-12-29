const historyKeys = {
    trustlines: 0,
    supply: 1,
    trades: 2,
    tradedAmount: 3,
    payments: 4,
    paymentsAmount: 5
}

const trustlineKeys = {
    established: 0,
    authorized: 1,
    funded: 2
}

function combineAssetHistory(history, sumSupply = true) {
    let res = {
        supply: 0,
        payments: 0,
        paymentsAmount: 0,
        trades: 0,
        tradedAmount: 0,
        trustlines: [0, 0, 0]
    }
    for (const value of Object.values(history)) {
        res.trustlines[trustlineKeys.established] += value[historyKeys.trustlines][trustlineKeys.established]
        res.trustlines[trustlineKeys.authorized] += value[historyKeys.trustlines][trustlineKeys.authorized]
        res.trustlines[trustlineKeys.funded] += value[historyKeys.trustlines][trustlineKeys.funded]
        res.payments += value[historyKeys.payments]
        res.paymentsAmount += Number(value[historyKeys.paymentsAmount])
        res.trades += value[historyKeys.trades]
        res.tradedAmount += value[historyKeys.tradedAmount]
        if (sumSupply) {
            res.supply += value[historyKeys.supply]
        } else {
            res.supply = value[historyKeys.supply]
        }
    }
    return res
}

function rehydrateAssetHistory(history, sumSupply = true) {
    let current = {
        supply: 0,
        trustlines: [0, 0, 0]
    }
    return Object.entries(history).map(([key, value]) => {
        const trustlines = [...current.trustlines]
        trustlines[trustlineKeys.established] += value[historyKeys.trustlines][trustlineKeys.established]
        trustlines[trustlineKeys.authorized] += value[historyKeys.trustlines][trustlineKeys.authorized]
        trustlines[trustlineKeys.funded] += value[historyKeys.trustlines][trustlineKeys.funded]
        current = {
            ts: parseInt(key),
            payments: value[historyKeys.payments],
            paymentsAmount: value[historyKeys.paymentsAmount],
            trades: value[historyKeys.trades],
            tradedAmount: value[historyKeys.tradedAmount],
            supply: sumSupply ? (current.supply + value[historyKeys.supply]) : value[historyKeys.supply],
            trustlines
        }
        return current
    })
}

module.exports = {combineAssetHistory, rehydrateAssetHistory}