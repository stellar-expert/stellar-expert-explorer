const {standardDeviation, average} = require('./stats-helpers')

function calculateStandardDeviation(data, n = 0) {
    if (n && data.length > n) {
        data = data.slice(data.length - n - 1)
    }
    return standardDeviation(data.map(price => average(price)))
}

module.exports = {calculateStandardDeviation}