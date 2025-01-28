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

function anyToNumber(value) {
    if (!value)
        return 0
    if (typeof value === 'number')
        return value
    if (typeof value === 'string')
        return parseFloat(value)
    if (typeof value.toNumber === 'function')
        return value.toNumber()
    throw TypeError(`Can't convert [${typeof value}] ${value} to number`)
}

/**
 * Convert arbitrary stringified number to Long representation
 * @param {String|Number} value
 * @return {BigInt}
 */
function toStroops(value) {
    if (!value)
        return 0n
    if (typeof value === 'number') {
        value = value.toFixed(7)
    }
    if (typeof value !== 'string' || !/^-?[\d.,]+$/.test(value))
        return 0n //invalid format
    try {
        let [int, decimal = '0'] = value.split(/[.,]/, 2)
        let negative = false
        if (int.startsWith('-')) {
            negative = true
            int = int.slice(1)
        }
        let res = BigInt(int) * 10000000n + BigInt(decimal.slice(0, 7).padEnd(7, '0'))
        if (negative) {
            res *= -1n
            if (res < -0x8000000000000000n) //overflow
                return 0n
        } else if (res > 0xFFFFFFFFFFFFFFFFn) //overflow
            return 0n
        return res
    } catch (e) {
        return 0n
    }
}

/**
 * Round value to specified precision
 * @param {number} value
 * @param {number} decimals
 * @return {number}
 */
function round(value, decimals = 3) {
    if (!value)
        return 0
    return parseFloat(value.toFixed(decimals))
}

module.exports = {formatAmount, formatWithPrecision, formatPercentage, adjustAmount, anyToNumber, round}