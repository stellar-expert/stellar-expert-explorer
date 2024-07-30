const ms = 1
const second = 1000
const minute = 60 * second
const hour = 60 * minute
const day = 24 * hour
const week = 7 * day
const month = 30 * week

const timeUnits = {ms, second, minute, hour, day, week, month}

const maxUnixTime = 2147483647

/**
 * Parse raw serialized date
 * @param  {String|Number|Date} ts - Raw date
 * @return {Number} Date in UNIX format
 */
function parseDate(ts) {
    if (typeof ts === 'string') {
        if (!/^\d+$/.test(ts)) {
            if (!ts.endsWith('Z')) {
                ts += 'Z'
            }
            ts = new Date(ts)
        } else {
            ts = parseInt(ts, 10)
        }
    }
    if (typeof ts === 'number') {
        //input is a Unix timestamp
        if (ts < 2147483648) {
            ts *= 1000
        }
        ts = new Date(ts)
    }
    if (!(ts instanceof Date) || isNaN(ts.valueOf()))
        return null
    return toUnixTime(ts)
}

/**
 * Serialize date object to string
 * @param {Date|Number} date
 * @return {String}
 */
function formatDateTime(date){
    if (!(date instanceof Date)) {
        date = new Date(date)
    }
    return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z/, '')
}

/**
 * Convert DateTime to Unix timestamp
 * @param {Date|Number} ts - Date object or number of milliseconds
 * @return {Number}
 */
function toUnixTime(ts) {
    if (ts instanceof Date) {
        ts = ts.getTime()
    }
    if (typeof ts !== 'number')
        throw new Error('Invalid date: ' + ts)
    return Math.floor(ts / 1000)
}

/**
 * Get current Unix timestamp
 * @return {Number}
 */
function unixNow() {
    return toUnixTime(new Date())
}

/**
 * Trim date with specified precision.
 * @param {Number} date - Date to trim (as UNIX timestamp).
 * @param {Number} hours - How to trim date (optional).
 * @return {Number}
 */
function trimDate(date, hours = 1) {
    const m = hours * 60 * 60
    return Math.floor(date / m) * m
}

module.exports = {
    timeUnits,
    maxUnixTime,
    parseDate,
    formatDateTime,
    trimDate,
    toUnixTime,
    unixNow
}