const {registerRoute} = require('../router')
const {
    queryContractState,
    fetchContractStateEntry
} = require('../../business-logic/contract-state/contract-state-query')

module.exports = function (app) {
    registerRoute(app,
        'contract-state/:parent/:durability/:key',
        {cache: 'stats'},
        ({params}) => fetchContractStateEntry(params.network, params.parent, params.key, params.durability))

    registerRoute(app,
        'contract-state/:parent',
        {cache: 'stats'},
        ({params, path, query}) => queryContractState(params.network, path, params.parent, query))

    //TODO: legacy, remove these routes
    registerRoute(app,
        'contract-data/:parent/:durability/:key',
        {cache: 'stats'},
        ({params}) => fetchContractStateEntry(params.network, params.parent, params.key, params.durability))

    registerRoute(app,
        'contract-data/:parent',
        {cache: 'stats'},
        ({params, path, query}) => queryContractState(params.network, path, params.parent, query))
}