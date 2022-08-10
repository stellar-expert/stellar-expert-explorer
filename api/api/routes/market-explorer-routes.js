const {registerRoute} = require('../router')
const {queryMarkets} = require('../../business-logic/dex/markets')
const {queryMarketStats} = require('../../business-logic/dex/market-stats')
const {aggregateMarketCandlesData} = require('../../business-logic/dex/market-ohlcvt')

module.exports = function (app) {
    registerRoute(app,
        'market',
        {cache: 'stats'},
        ({params, query, path}) => queryMarkets(params.network, path, query))

    registerRoute(app,
        'market/:selling/:buying/candles',
        {cache: 'stats'},
        ({params, query}) => aggregateMarketCandlesData(params.network, params.selling, params.buying, query))

    registerRoute(app,
        'market/:selling/:buying',
        {cache: 'stats'},
        ({params, query}) => queryMarketStats(params.network, params.selling, params.buying, query))
}