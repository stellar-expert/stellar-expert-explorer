const {registerRoute} = require('../router')
const {queryGeneralSorobanStats, querySorobanInteractionHistory} = require('../../business-logic/contracts/soroban-stats')

module.exports = function (app) {
    registerRoute(app,
        'contract-stats',
        {cache: 'stats'},
        ({params}) => queryGeneralSorobanStats(params.network))

    registerRoute(app,
        'contract-stats-history',
        {cache: 'stats'},
        ({params}) => querySorobanInteractionHistory(params.network))
}