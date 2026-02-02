const {registerRoute} = require('../router')
const {queryAllAssets} = require('../../business-logic/asset/asset-list')
const {queryAssetsOverallStats} = require('../../business-logic/asset/asset-stats-list')
const {queryAssetStats} = require('../../business-logic/asset/asset-stats')
const {queryAssetRating} = require('../../business-logic/asset/asset-rating')
const {queryAssetStatsHistory} = require('../../business-logic/asset/asset-stats-history')
const {queryAssetSupply} = require('../../business-logic/asset/asset-supply')
const {queryAssetTradingPairs} = require('../../business-logic/asset/asset-trading-pairs')
const {queryAssetsMeta} = require('../../business-logic/asset/asset-meta')
const {queryAssetTrades} = require('../../business-logic/dex/trades')
const {queryAssetHolders, queryHolderPosition, queryAssetDistribution} = require('../../business-logic/asset/asset-holders')
const {queryAssetPrices} = require('../../business-logic/asset/asset-price')
const {aggregateAssetPriceCandlesData, aggregateAssetWeightedPrices} = require('../../business-logic/asset/asset-ohlcvt')

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
        'asset/price',
        {cache: 'stats', cors: 'open'},
        ({params, query, path}) => queryAssetPrices(params.network, path, query))

    registerRoute(app,
        'asset/price-history',
        {cache: 'stats', billingCategory: 'assetCandles'},
        ({params, query}) => aggregateAssetWeightedPrices(params.network, query))

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
        {cache: 'stats', cors: 'open'},
        ({params}) => queryAssetRating(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/history/trades',
        {cache: 'tx'},
        ({params, query, path}) => {
            const {network, asset} = params
            return queryAssetTrades(network, asset, path, query)
        })

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
        {cache: 'stats', cors: 'open'},
        ({params, query, path}) => queryHolderPosition(params.network, params.asset, params.account))

    registerRoute(app,
        'asset/:asset/trading-pairs',
        {cache: 'stats'},
        ({params}) => queryAssetTradingPairs(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/supply',
        {cache: 'stats', cors: 'open', headers: {'content-type': 'text/plain'}},
        ({params}) => queryAssetSupply(params.network, params.asset))

    registerRoute(app,
        'asset/:asset/candles',
        {cache: 'stats', billingCategory: 'assetCandles'},
        ({params, query}) => aggregateAssetPriceCandlesData(params.network, params.asset, query))
}