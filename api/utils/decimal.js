const {Decimal128} = require('mongodb')

/**
 * @param {Decimal128|string|bigint} value
 * @return {bigint}
 */
function decimalToBigint(value) {
    if (typeof value === 'bigint')
        return value
    if (typeof value === 'string') {
        value = Decimal128.fromStringWithRounding(value).toString()
    }
    if (typeof value !== 'string') {
        value = value.toString()
    }
    if (value.includes('E+')) {
        const [n, exp] = value.split('E+')
        const decimals = parseInt(exp)
        const int = BigInt(n.replace('.', '').padEnd(decimals + 1, '0'))
        return int
    } else if (value.includes('E-')) { //discard
        return 0n
    } else {
        return BigInt(value.split('.')[0])
    }
}

/**
 * @param {bigint|string} value
 */
function bigintToDecimal(value) {
    if (value instanceof Decimal128)
        return value
    if (typeof value !== 'string') {
        value = value.toString(10)
    }
    return Decimal128.fromStringWithRounding(value)
}

module.exports = {decimalToBigint, bigintToDecimal}