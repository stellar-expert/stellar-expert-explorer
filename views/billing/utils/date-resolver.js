
export function getDaysLeft(date) {
    const diff = date - new Date()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * A number of days with the noun that agrees with it - "1 day", "12 days"
 * @param {Number} days
 * @return {String}
 */
export function describeDays(days) {
    return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function getSubscriptionPeriod(period = 'year', from, to) {
    const fromDate = from ? new Date(from) : new Date()
    const start = new Date(fromDate).setUTCHours(0, 0, 0, 0)
    const end = to ? new Date(to).getTime() : addMonths(start, period === 'year' ? 12 : 1)

    return [start, end]
}

/**
 * Advance a timestamp by whole calendar months
 * @param {Number} ts - epoch ms
 * @param {Number} months
 * @return {Number} epoch ms
 */
export function addMonths(ts, months) {
    const date = new Date(ts)
    date.setUTCMonth(date.getUTCMonth() + months)
    return date.getTime()
}