const ms = 1,
    second = 1000,
    minute = 60 * second,
    hour = 60 * minute,
    day = 24 * hour,
    week = 7 * day,
    month = 30 * week

const timeUnits = {ms, second, minute, hour, day, week, month}

/**
 * Parse raw serialized date.
 * @param  {String|Number} ts - Raw date.
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
            ts = parseInt(ts)
        }
    }
    if (typeof ts === 'number') {
        //input is a Unix timestamp
        if (ts < 2147483648) {
            ts *= 1000
        }
        ts = new Date(ts)
    }
    if (!(ts instanceof Date) || isNaN(ts.valueOf())) return null
    return Math.floor(ts.getTime() / 1000)
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
    parseDate,
    trimDate
}