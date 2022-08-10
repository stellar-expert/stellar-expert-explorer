const {Long} = require('bson')

function normalizeNumber(numeric) {
    //null, NaN, undefined, etc.
    if (!numeric) return 0
    //handle BSON types
    if (numeric.toNumber) return numeric.toNumber()
    return numeric
}

function trimZeros(stringNum) {
    return stringNum.replace(/\.?0+$/, '')
}

/**
 * Converts Int64 Stellar representation to a standard decimal number.
 * @param {Long|Number} numeric - Value to process.
 * @return {String}
 */
function adjustAmount(numeric) {
    if (numeric instanceof Long) {
        let res = numeric.toString()
        if (res === '0') return res
        if (res.length < 8) {
            res = '0.' + res.padStart(7, '0')
        } else {
            res = res.substr(0, res.length - 7) + '.' + res.substr(-7)
        }
        return trimZeros(res)
    }
    if (numeric === 0) return '0'
    return trimZeros((normalizeNumber(numeric) / 10000000).toFixed(7))
}

/**
 * Format numeric value in a standard notation with arbitrary decimals.
 * @param {Long|Number} numeric - Value to format.
 * @param {Number} [precision=7] - Result decimals (7 digits by default).
 * @return {String}
 */
function formatAmount(numeric, precision = 7) {
    return trimZeros(normalizeNumber(numeric).toFixed(7))
}

/**
 * Format numeric value with specific precision.
 * @param {Long|Number} numeric - Value to format.
 * @param {Number} [precision=7] - Result precision (8 digits by default).
 * @return {String}
 */
function formatWithPrecision(numeric, precision = 8) {
    numeric = normalizeNumber(numeric)
    let res
    //avoid exponential numerics
    if (numeric > 10 ** (precision + 1)) {
        res = Math.round(numeric).toString()
    } else {
        res = numeric.toPrecision(precision)
    }
    return trimZeros(res)
}

function formatPercentage(value) {
    let asString = (value * 100).toFixed(2)
    if (asString[0] !== '-') {
        asString = '+' + asString
    }
    return trimZeros(asString)
}

module.exports = {formatAmount, formatWithPrecision, formatPercentage, adjustAmount}