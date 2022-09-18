const {registerRoute} = require('../router')
const {estimateClaimableBalancesValue} = require('../../business-logic/claimable-balances/claimable-balances-value-estimator')

module.exports = function (app) {
    registerRoute(app,
        'claimable-balance/value',
        {cache: 'operations'},
        ({params, query, path}) => estimateClaimableBalancesValue(params.network, path, query))
}