const {registerRoute} = require('../router'),
    {queryAllAssets} = require('../../business-logic/asset/asset-list'),
    {queryAssetsOverallStats} = require('../../business-logic/asset/asset-stats-list'),
    {queryAssetStats} = require('../../business-logic/asset/asset-stats'),
    {queryAssetRating} = require('../../business-logic/asset/asset-rating'),
    {queryAssetStatsHistory} = require('../../business-logic/asset/asset-stats-history'),
    {queryAssetSupply} = require('../../business-logic/asset/asset-supply'),
    {queryAssetTradingPairs} = require('../../business-logic/asset/asset-trading-pairs'),
    {queryAssetsMeta} = require('../../business-logic/asset/asset-meta'),
    {queryAssetTrades} = require('../../business-logic/dex/trades'),
    {queryAssetOperations} = require('../../business-logic/operation/operations'),
    {queryAssetHolders, queryHolderPosition, queryAssetDistribution} = require('../../business-logic/asset/asset-holders')

module.exports = function (app) {
    registerRoute(app,
        'asset',
        {cache: 'global-stats', cors: 'open'},
        ({params, query, path}) => queryAllAssets(params.network, path, query))

    registerRoute(app,
        'asset-stats/overall',
        {cache: 'global-stats'},
        ({params, query}) => queryAssetsOverallStats(params.network, query))

    registerRoute(app,
        'asset/meta',
        {cache: 'stats', cors: 'open'},
        ({params, query, path}) => queryAssetsMeta(params.network, path, query))

    registerRoute(app,
        'asset/:asset',
        {cache: 'stats'},
        ({params, query}) => queryAssetStats(params.network, params.asset, query))

    registerRoute(app,
        'asset/:asset/stats-history',
        {cache: 'stats'},
        ({params}) => queryAssetStatsHistory(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/rating',
        {cache: 'stats'},
        ({params}) => queryAssetRating(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/history/:filter',
        {cache: 'operations'},
        ({params, query, path}) => {
            const {filter, network, asset} = params
            if (filter === 'trades') return queryAssetTrades(network, asset, path, query)
            return queryAssetOperations(network, asset, filter, path, query)
        })

    registerRoute(app,
        'asset/:asset/rating',
        {cache: 'stats'},
        ({params}) => queryAssetRating(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/holders',
        {cache: 'stats'},
        ({params, query, path}) => queryAssetHolders(params.network, params.asset, path, query))

    registerRoute(app,
        'asset/:asset/distribution',
        {cache: 'stats'},
        ({params, query, path}) => queryAssetDistribution(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/position/:account',
        {cache: 'stats'},
        ({params, query, path}) => queryHolderPosition(params.network, params.asset, params.account))

    registerRoute(app,
        'asset/:asset/trading-pairs',
        {cache: 'stats'},
        ({params}) => queryAssetTradingPairs(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/supply',
        {cache: 'stats', cors: 'open', headers: {'content-type': 'text/plain'}},
        ({params}) => queryAssetSupply(params.network, params.asset))
}