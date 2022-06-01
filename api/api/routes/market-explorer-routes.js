const {registerRoute} = require('../router'),
    {queryMarkets} = require('../../business-logic/dex/markets'),
    {queryMarketStats} = require('../../business-logic/dex/market-stats')

module.exports = function (app) {
    registerRoute(app,
        'market',
        {cache: 'global-stats'},
        ({params, query, path}) => queryMarkets(params.network, path, query))

    registerRoute(app,
        'market/:selling/:buying',
        {cache: 'global-stats'},
        ({params, query}) => queryMarketStats(params.network, params.selling, params.buying, query))
}