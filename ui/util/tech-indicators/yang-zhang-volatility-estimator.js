const {standardDeviation, mean} = require('./stats-helpers')

function calculateVolatility(data, n) {
    if (!data || !data.length) return 0
    if (n === undefined) {
        n = data.length
    }
    let close_vol = 0,
        open_vol = 0,
        window_rs = 0
    if (data.length > n) {
        data = data.slice(data.length - n - 1)
    }

    for (let i = 1; i < data.length; i++) {
        const [open, high, low, close] = data[i],
            prevClose = data[i - 1][3]

        const log_ho = Math.log(high / open),
            log_lo = Math.log(low / open),
            log_co = Math.log(close / open)

        const log_oc = Math.log(open / prevClose),
            log_oc_sq = Math.pow(log_oc, 2),
            log_cc = Math.log(close / prevClose),
            log_cc_sq = Math.pow(log_cc, 2)

        const rs = log_ho * (log_ho - log_co) + log_lo * (log_lo - log_co)

        close_vol += log_cc_sq
        open_vol += log_oc_sq
        window_rs += rs
    }

    close_vol = close_vol * (1 / (n - 1))
    open_vol = open_vol * (1 / (n - 1))
    window_rs = window_rs * (1 / (n - 1))

    const k = 0.34 / (1.34 + (n + 1) / (n - 1)),
        yz = open_vol + (k * close_vol) + ((1 - k) * window_rs),
        firstClose = data[0][3]

    return firstClose * (yz * 100)
}

function estimateVolatilityRolling(n, data) {
    //generate YZ vol for each item in the N period
    data = data.slice(0).reverse()
    const dataset = []
    for (let i = n - 1; i >= 0; --i) {
        const rolling = data.slice(i, (n + i - 1)).reverse()
        dataset.push(calculateVolatility(rolling, n))

    }
    return {
        vol: dataset[0],
        stdDev: standardDeviation(dataset),
        mean: mean(dataset)
    }
}

module.exports = {calculateVolatility}