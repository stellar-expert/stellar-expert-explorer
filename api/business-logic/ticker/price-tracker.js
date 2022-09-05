const {parseDate, trimDate, unixNow} = require('../../utils/date-utils')
const {aggregateOhlcvt, encodeAssetOhlcvtId, OHLCVT} = require('../dex/ohlcvt-aggregator')
const db = require('../../connectors/mongodb-connector')

const network = 'public'
const day = 86400

function normalizeDate(date) {
    if (date instanceof Date) return date
    if (!date) return new Date()
    return parseDate(date)
}

class PriceTracker {
    constructor() {
        this.prices = []
    }

    prices

    lastUpdated = 0

    updatingPromise = null

    /**
     * Aggregate and fetch prices from db
     * @return {Promise}
     * @private
     */
    fetchPrices() {
        if (this.updatingPromise)
            return this.updatingPromise
        const recentOnly = this.prices.length > 0
        const fromTs = recentOnly ? trimDate(unixNow(), 24) - day : 0
        this.updatingPromise = Promise.all([this.fetchExternalXlmPrices(fromTs), this.fetchOhlcvtPrices(fromTs)])
            .then(all => {
                const prices = this.mergePriceTimelines(all)
                if (recentOnly) {
                    let overlapped = false
                    for (let np of prices) {
                        for (let i = 0; i < 2; i++) {
                            const ep = this.prices[i]
                            if (ep[0] < np[0]) { //new date - put to the beginning
                                this.prices.unshift(np)
                                break
                            }
                            if (ep[0] === np[0]) {
                                ep[1] = np[1] //the same date - update price
                                overlapped = true
                                break
                            }
                        }
                    }
                    if (!overlapped) {
                        console.error(`Failed to merge updated prices - panic reset`)
                        process.exit(-1)
                    }
                } else {
                    this.prices = prices
                }
                this.lastUpdated = unixNow()
                this.updatingPromise = null
            })

        return this.updatingPromise
    }

    /**
     * @param {Number} fromTs
     * @return {Promise<[Number,Number][]>}
     * @private
     */
    fetchOhlcvtPrices(fromTs) {
        return aggregateOhlcvt({
            network,
            collection: 'asset_ohlcvt',
            order: -1,
            resolution: day,
            fromId: encodeAssetOhlcvtId(0, fromTs),
            toId: encodeAssetOhlcvtId(1, 0)
        })
            .then(res => res.map(v => {
                const p = v[OHLCVT.QUOTE_VOLUME] / v[OHLCVT.BASE_VOLUME] //use avg daily prices
                return [v[OHLCVT.TIMESTAMP], p]
            }))
    }

    /**
     * @param {Number} fromTs
     * @return {Promise<[Number,Number][]>}
     * @private
     */
    fetchExternalXlmPrices(fromTs) {
        const pipeline = [
            {
                $group: {
                    _id: {$floor: {$divide: ['$_id', day]}},
                    price: {$avg: '$price'}
                }
            },
            {
                $sort: {_id: -1}
            },
            {
                $project: {
                    _id: 0,
                    v: [{$multiply: ['$_id', day]}, '$price']
                }
            }
        ]
        if (fromTs) {
            pipeline.unshift({$match: {_id: {$gte: fromTs}}})
        }
        return db[network].collection('external_xlm_rates').aggregate(pipeline)
            .toArray()
            .then(res => res.map(entry => entry.v))
    }

    /**
     * @param {[Number,Number][][]} timelines
     * @return {[Number,Number][]}
     * @private
     */
    mergePriceTimelines(timelines) {
        const accumulator = {}
        for (const timeline of timelines) {
            for (let [ts, p] of timeline) {
                const prev = accumulator[ts]
                if (prev) {
                    p = (prev + p) / 2
                }
                accumulator[ts] = p
            }
        }
        const res = Object.entries(accumulator).map(([ts, p]) => {
            const n = 10 ** (5 - Math.floor(Math.log10(p)))
            return [parseInt(ts), Math.round(p * n) / n]
        })
        //ensure correct order
        res.sort((a, b) => b[0] - a[0])
        return res
    }

    /**
     * Ensure that prices are up-to-date
     * @return {Promise}
     * @private
     */
    async refresh() {
        if (this.lastUpdated + 120 < unixNow()) { //update only if last time was updated more than 2 minutes ago
            await this.fetchPrices()
        }
    }

    /**
     * Get price record by date.
     * @param {Date|Number|String} date - Price date.
     * @return {Promise<Number>}
     */
    async getPrice(date) {
        await this.refresh()
        date = normalizeDate(date)
        const entry = this.prices.find(entry => entry[0] <= date)
        if (!entry) return 0 //price wasn't found
        return entry[1]
    }

    /**
     * Get daily adjusted prices
     * @return {Promise<[]>}
     */
    async getDailyPrices() {
        await this.refresh()
        return this.prices
    }
}

module.exports = new PriceTracker()