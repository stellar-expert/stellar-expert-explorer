const {unixNow} = require('../../utils/date-utils')

const lpHistoryKeys = {
    shares: 0,
    reserves: 1,
    accounts: 2,
    trades: 3,
    volume: 4,
    earned: 5
}

const aggregateValueMapping = {
    total_value_locked: 'reserves',
    earned_fees_value: 'earned_fees',
    volume_value: 'volume'
}

/**
 * @param {{}} rawHistory
 * @return {{ts: number, shares: bigint, accounts: number, trades: number, reserves: bigint[], volume: bigint[], earned: bigint[]}[]}
 * @param {{ts,price}[][]} [prices] - Prices relevant for pool assets (in the same order as pool reserves)
 * @param {number} [from]
 */
function rehydratePoolHistory(rawHistory, prices, from = undefined) {
    let prevAccounts = 0
    let prevShares = '0'
    return Object.entries(rawHistory).map(([key, value]) => {
        if (from && parseInt(key) < from)
            return null
        const record = {
            ts: parseInt(key),
            shares: value[lpHistoryKeys.shares],
            accounts: value[lpHistoryKeys.accounts],
            reserves: value[lpHistoryKeys.reserves],
            trades: value[lpHistoryKeys.trades],
            volume: value[lpHistoryKeys.volume],
            earned_fees: value[lpHistoryKeys.earned]
        }
        if (record.reserves[0] > 0) {
            if (record.accounts === 0) {
                record.accounts = prevAccounts
            } else {
                prevAccounts = record.accounts
            }
            if (record.shares === '0') {
                record.shares = prevShares
            } else {
                prevShares = record.shares
            }
        }
        if (prices) {
            const currentPrices = [findPrice(prices[0], record.ts), findPrice(prices[1], record.ts)]
            for (const [resKey, valKey] of Object.entries(aggregateValueMapping)) {
                let res = 0
                for (let i = 0; i < 2; i++) {
                    const price = currentPrices[i]
                    if (!price)
                        continue
                    res += Number(record[valKey][i]) * price
                }
                record[resKey] = Math.floor(res)
            }
        }
        return record
    }).filter(v => !!v)
}

/**
 * @param {[]} history - Rehydrated pool history
 * @param {{ts,price}[][]} prices - Prices relevant for pool assets (in the same order as pool reserves)
 */
function aggregatePoolHistory(history, prices) {
    const dayAgo = unixNow() - 24 * 60 * 60
    const weekAgo = dayAgo - 6 * 24 * 60 * 60
    const res = {
        trades: 0,
        trades1d: 0,
        trades7d: 0,
        volume: [0, 0],
        volume1d: [0, 0],
        volume7d: [0, 0],
        earned: [0, 0],
        earned1d: [0, 0],
        earned7d: [0, 0],
        volume_value1d: [0, 0],
        volume_value7d: [0, 0],
        earned_value1d: [0, 0],
        earned_value7d: [0, 0]
    }
    for (let {ts, volume, earned_fees: earned, trades} of history) {
        res.trades += trades
        res.earned[0] += earned[0]
        res.earned[1] += earned[1]
        res.volume[0] += volume[0]
        res.volume[1] += volume[1]
        if (ts >= weekAgo) {
            res.trades7d += trades
            res.volume7d[0] += volume[0]
            res.volume7d[1] += volume[1]
            res.earned7d[0] += earned[0]
            res.earned7d[1] += earned[1]
            const price = [findPrice(prices[0], ts), findPrice(prices[1], ts)]
            const vv = [Math.floor(volume[0] * price[0]), Math.floor(volume[1] * price[1])]
            const ev = [Math.floor(earned[0] * price[0]), Math.floor(earned[1] * price[1])]
            res.volume_value7d[0] += vv[0]
            res.volume_value7d[1] += vv[1]
            res.earned_value7d[0] += ev[0]
            res.earned_value7d[1] += ev[1]
            if (ts >= dayAgo) {
                res.trades1d += trades
                res.volume1d[0] += volume[0]
                res.volume1d[1] += volume[1]
                res.earned1d[0] += earned[0]
                res.earned1d[1] += earned[1]
                res.volume_value1d[0] += vv[0]
                res.volume_value1d[1] += vv[1]
                res.earned_value1d[0] += ev[0]
                res.earned_value1d[1] += ev[1]
            }
        }
    }
    return res
}

function estimatePoolTvl(reserves, prices, ts) {
    if (!ts) {
        ts = unixNow()
    }
    return Math.floor(reserves.map((r, i) => Number(r) * findPrice(prices[i], ts)).reduce((a, b) => a + b, 0))
}

function findPrice(prices, ts) {
    if (!prices?.length)
        return 0
    return prices.find(p => p.ts <= ts)?.price || 0
}

module.exports = {rehydratePoolHistory, aggregatePoolHistory, estimatePoolTvl}