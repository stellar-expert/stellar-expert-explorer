const OperationsQuery = require('./operations-query'),
    {validateAssetName, validateAccountAddress, validateOfferId, validatePoolId} = require('../validators'),
    errors = require('../errors')

/**
 *
 * @param {String} filter - operations type filter
 * @param {String[]} [allowedFilters] - allowed filters for a given endpoint(optional)
 * @return {Number[]}
 */
function decodeFilter(filter, allowedFilters = null) {
    filter = ('' + filter).toLowerCase()
    if (filter === 'all') return
    if (!allowedFilters || allowedFilters.includes(filter)) {
        switch (filter) {
            case 'offers':
                return [3, 4, 12]
            case 'payments':
                return [0, 1, 2, 8, 13, 14, 15, 19, 20]
            case 'trustlines':
                return [6, 7, 21]
            case 'settings':
                return [0, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 21, 22, 23]
        }
    }
    throw errors.validationError('filter', `Invalid operations filter: "${filter}"`)
}

async function queryAssetOperations(network, asset, filter, basePath, query) {
    validateAssetName(asset)
    const opQuery = new OperationsQuery(network, basePath, query)
    opQuery.addTypesFilter(decodeFilter(filter))
    await opQuery.addAssetFilter([asset])
    return await opQuery.toArray()
}

async function queryAccountOperations(network, account, filter, basePath, query) {
    validateAccountAddress(account)
    const opQuery = new OperationsQuery(network, basePath, query)
    opQuery.addTypesFilter(decodeFilter(filter))
    await opQuery.addAccountFilter([account])
    return await opQuery.toArray()
}

async function queryOfferOperations(network, offerId, filter, basePath, query) {
    validateOfferId(offerId)
    const opQuery = new OperationsQuery(network, basePath, query)
    await opQuery.addOfferFilter([offerId])
    return await opQuery.toArray()
}

async function queryPoolOperations(network, poolId, filter, basePath, query) {
    validatePoolId(poolId)
    const opQuery = new OperationsQuery(network, basePath, query)
    opQuery.addTypesFilter(decodeFilter(filter, ['trustlines', 'settings']))
    await opQuery.addPoolFilter([poolId])
    return await opQuery.toArray()
}

module.exports = {
    queryAssetOperations,
    queryAccountOperations,
    queryOfferOperations,
    queryPoolOperations
}