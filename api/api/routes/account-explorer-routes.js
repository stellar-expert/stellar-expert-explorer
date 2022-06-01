const {registerRoute} = require('../router'),
    {queryAccountStats} = require('../../business-logic/account/account-stats'),
    {queryAccountStatsHistory} = require('../../business-logic/account/account-stats-history'),
    {queryAllAccounts} = require('../../business-logic/account/account-list'),
    {queryAccountBalanceHistory} = require('../../business-logic/account/account-balance-history'),
    {queryAccountTrades} = require('../../business-logic/dex/trades'),
    {queryAccountOperations} = require('../../business-logic/operation/operations'),
    {queryAccountClaimableBalances} = require('../../business-logic/claimable-balances/claimable-balances')

module.exports = function (app) {
    registerRoute(app,
        'account',
        {cache: 'stats'},
        ({params, query, path}) => queryAllAccounts(params.network, path, query))

    registerRoute(app,
        'account/:account',
        {cache: 'stats'},
        ({params, query}) => queryAccountStats(params.network, params.account, query))

    registerRoute(app,
        'account/:account/stats-history',
        {cache: 'stats'},
        ({params, query}) => queryAccountStatsHistory(params.network, params.account, query))

    registerRoute(app,
        'account/:account/history/:filter',
        {cache: 'operations'},
        ({params, query, path}) => {
            const {filter, network, account} = params
            if (filter === 'trades') return queryAccountTrades(network, account, path, query)
            return queryAccountOperations(network, account, filter, path, query)
        })

    //TODO: re-route to account/:account/stats-history once we open this endpoint
    registerRoute(app,
        'account/:account/balance/history',
        {cache: 'operations', cors: 'open'},
        ({params}) => queryAccountBalanceHistory(params.network, params.account))

    registerRoute(app,
        'account/:account/claimable-balances',
        {cache: 'operations'},
        ({params, query, path}) => {
            const {network, account} = params
            return queryAccountClaimableBalances(network, account, path, query)
        })
}