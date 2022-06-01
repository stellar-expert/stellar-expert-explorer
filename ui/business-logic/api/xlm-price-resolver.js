import {apiCall} from '../../models/api'

let prices

export const waitPricesLoaded = apiCall('xlm-price')
    .then(data => {
        prices = data.map(([ts, price]) => [ts * 1000, price])
    })

export function getPrice(date) {
    if (typeof date === 'number') {
        date = new Date(date)
    }
    if (!(date instanceof Date)) throw new Error(`Invalid date: ${date}.`)
    for (let [ts, price] of prices) {
        if (ts < date) return price
    }
    return 0 //price wasn't found
}