const errors = require('../errors')

function searchPayments(network, basePath, query) {
    return Promise.reject(errors.notFound())
}

module.exports = {searchPayments}