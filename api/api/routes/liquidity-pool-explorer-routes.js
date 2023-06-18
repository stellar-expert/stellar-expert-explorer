const {registerRoute} = require('../router')
const {queryLiquidityPoolStats} = require('../../business-logic/liquidity-pool/liquidity-pool-stats')
const {queryLiquidityPoolHistory} = require('../../business-logic/liquidity-pool/liquidity-pool-history')
const {queryAllLiquidityPools} = require('../../business-logic/liquidity-pool/liquidity-pool-list')
const {queryPoolTrades} = require('../../business-logic/dex/trades')
const {queryAssetHolders} = require('../../business-logic/asset/asset-holders')

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
        'liquidity-pool/:poolId/history/trades',
        {cache: 'tx'},
        ({params, query, path}) => {
            const {network, poolId} = params
            return queryPoolTrades(network, poolId, path, query)
        })

    registerRoute(app,
        'liquidity-pool/:pool/holders',
        {cache: 'stats'},
        ({params, query, path}) => queryAssetHolders(params.network, params.pool, path, query))

    /*    registerRoute(app,
            'liquidity-pool/:pool/distribution',
            {cache: 'stats'},
            ({params, query, path}) => queryLiquidityPoolDistribution(params.network, params.pool))

    registerRoute(app,
        'liquidity-pool/:pool/position/:account',
        {cache: 'stats'},
        ({params, query, path}) => queryLiquidityPoolPosition(params.network, params.pool, params.account))*/
}