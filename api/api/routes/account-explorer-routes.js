const {registerRoute} = require('../router')
const {queryAccountStats} = require('../../business-logic/account/account-stats')
const {queryAccountStatsHistory} = require('../../business-logic/account/account-stats-history')
const {queryAllAccounts} = require('../../business-logic/account/account-list')
const {queryAccountBalanceHistory} = require('../../business-logic/account/account-balance-history')
const {queryAccountTrades} = require('../../business-logic/dex/trades')
const {queryAccountClaimableBalances} = require('../../business-logic/claimable-balances/claimable-balances')
const {estimateAccountValue} = require('../../business-logic/account/account-value-estimator')

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
        'account/:account/history/trades',
        {cache: 'tx'},
        ({params, query, path}) => {
            const {filter, network, account} = params
            return queryAccountTrades(network, account, path, query)
        })

    registerRoute(app,
        'account/:account/balance/:asset/history',
        {cache: 'balance'},
        ({params}) => queryAccountBalanceHistory(params.network, params.account, params.asset))

    registerRoute(app,
        'account/:account/claimable-balances',
        {cache: 'balance'},
        ({params, query, path}) => {
            const {network, account} = params
            return queryAccountClaimableBalances(network, account, path, query)
        })

    registerRoute(app,
        'account/:account/value',
        {cache: 'stats'},
        ({params, query}) => estimateAccountValue(params.network, params.account, query.currency, query.ts))

}