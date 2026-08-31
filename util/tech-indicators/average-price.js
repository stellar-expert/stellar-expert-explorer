const {average} = require('./stats-helpers')

function calculateAveragePrice(data, n = 0) {
    if (n && data.length > n) {
        data = data.slice(data.length - n - 1)
    }
    return average(data.map(price => average(price)))
}

module.exports = {calculateAveragePrice}