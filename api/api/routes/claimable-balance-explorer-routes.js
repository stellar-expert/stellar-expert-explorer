const {registerRoute} = require('../router')
const {estimateClaimableBalancesValue} = require('../../business-logic/claimable-balances/claimable-balances-value-estimator')
const {loadClaimableBalance} = require('../../business-logic/claimable-balances/claimable-balances')

module.exports = function (app) {
    registerRoute(app,
        'claimable-balance/value',
        {cache: 'balance'},
        ({params, query, path}) => estimateClaimableBalancesValue(params.network, path, query))

    registerRoute(app,
        'claimable-balance/:id',
        {cache: 'balance'},
        ({params}) => loadClaimableBalance(params.network, params.id))
}