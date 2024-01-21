const {registerRoute} = require('../router')
const {queryContractData, fetchContractDataEntry} = require('../../business-logic/contract-data/contract-data-query')

module.exports = function (app) {
    registerRoute(app,
        'contract-data/:parent/:key',
        {cache: 'stats'},
        ({params}) => fetchContractDataEntry(params.network, params.parent, params.key))

    registerRoute(app,
        'contract-data/:parent',
        {cache: 'stats'},
        ({params, path, query}) => queryContractData(params.network, path, params.parent, query))
}