const {registerRoute} = require('../router'),
    {queryLiquidityPoolStats} = require('../../business-logic/liquidity-pool/liquidity-pool-stats'),
    {queryLiquidityPoolHistory} = require('../../business-logic/liquidity-pool/liquidity-pool-history'),
    {queryAllLiquidityPools} = require('../../business-logic/liquidity-pool/liquidity-pool-list'),
    {queryPoolTrades} = require('../../business-logic/dex/trades'),
    {queryPoolOperations} = require('../../business-logic/operation/operations'),
    {queryLiquidityPoolHolders, queryLiquidityPoolPosition} = require('../../business-logic/liquidity-pool/liquidity-pool-holders')

module.exports = function (app) {
    registerRoute(app,
        'liquidity-pool',
        {
            cors: 'open',
            cache: 'stats'
        },
        ({params, query, path}) => queryAllLiquidityPools(params.network, path, query))

    registerRoute(app,
        'liquidity-pool/:poolId',
        {
            cors: 'open',
            cache: 'stats'
        },
        ({params, query}) => queryLiquidityPoolStats(params.network, params.poolId))

    registerRoute(app,
        'liquidity-pool/:poolId/stats-history',
        {
            cors: 'open',
            cache: 'stats'
        },
        ({params, path, query}) => queryLiquidityPoolHistory(params.network, params.poolId, path, query))


    registerRoute(app,
        'liquidity-pool/:poolId/history/:filter',
        {cache: 'operations'},
        ({params, query, path}) => {
            const {filter, network, poolId} = params
            if (filter === 'trades') return queryPoolTrades(network, poolId, path, query)
            return queryPoolOperations(network, poolId, filter, path, query)
        })

    registerRoute(app,
        'liquidity-pool/:pool/holders',
        {cache: 'stats'},
        ({params, query, path}) => queryLiquidityPoolHolders(params.network, params.pool, path, query))

/*    registerRoute(app,
        'liquidity-pool/:pool/distribution',
        {cache: 'stats'},
        ({params, query, path}) => queryLiquidityPoolDistribution(params.network, params.pool))*/

    registerRoute(app,
        'liquidity-pool/:pool/position/:account',
        {cache: 'stats'},
        ({params, query, path}) => queryLiquidityPoolPosition(params.network, params.pool, params.account))
}