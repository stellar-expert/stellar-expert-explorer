const db = require('../../connectors/mongodb-connector'),
    {parseDate, trimDate} = require('../../utils/date-utils')

const network = 'public',
    pollInterval = 5000 //every 5 seconds

function normalizeDate(date) {
    if (date instanceof Date) return date
    if (!date) return new Date()
    return parseDate(date)
}

class PriceTracker {
    constructor() {
        this.prices = []
    }

    async init() {
        if (this.initialized) return
        await this.update()
        this.interval = setInterval(() => this.update(), pollInterval)
        this.initialized = true
    }

    async update() {
        const queryPredicate = {}
        if (this.cursor) {
            queryPredicate._id = {$gt: this.cursor}
        }
        const iterator = await db[network].collection('xlm_price')
            .find(queryPredicate)
            .sort({_id: 1})
        while (true) {
            const entry = await iterator.next()
            if (!entry) break
            this.prices.unshift(entry)
            this.cursor = entry._id
        }
    }

    get recentPrice() {
        return this.prices[0]?.price || 0
    }


    /**
     * Get price record by date.
     * @param {Date|Number|String} date - Price date.
     * @return {Number}
     */
    getPrice(date) {
        date = normalizeDate(date)
        const entry = this.prices.find(entry => entry._id <= date)
        if (!entry) return 0 //price wasn't found
        return entry.price
    }

    getDailyPrices() {
        const res = []
        let last = 0
        for (let {_id, price} of this.prices) {
            const day = trimDate(_id, 24)
            if (day < last || last === 0) {
                last = day
                res.push([_id, price])
            }
        }
        return res
    }
}

module.exports = new PriceTracker()