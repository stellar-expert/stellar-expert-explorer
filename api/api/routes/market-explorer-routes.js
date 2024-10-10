const {registerRoute} = require('../router')
const errors = require('../../business-logic/errors')
const {queryMarkets} = require('../../business-logic/dex/markets')
const {queryMarketStats} = require('../../business-logic/dex/market-stats')
const {aggregateMarketCandlesData} = require('../../business-logic/dex/market-ohlcvt')
const {fetchActiveUsdcMarkets} = require('../../business-logic/dex/active-usdc-markets')

module.exports = function (app) {
    registerRoute(app,
        'market',
        {cache: 'stats'},
        ({params, query, path}) => queryMarkets(params.network, path, query))

    registerRoute(app,
        'market/:selling/:buying/candles',
        {cache: 'stats', billingCategory: 'marketCandles'},
        ({params, query}) => aggregateMarketCandlesData(params.network, params.selling, params.buying, query))

    registerRoute(app,
        'market/:selling/:buying',
        {cache: 'stats'},
        ({params, query}) => queryMarketStats(params.network, params.selling, params.buying, query))

    registerRoute(app,
        'active-market/:asset',
        {cache: 'stats', cors: 'open'},
        ({params}) => {
            if (params.network !== 'public')
                throw errors.validationError('network', 'Invalid Stellar network: ' + params.network)
            const {asset} = params
            if (asset !== 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-1')
                throw errors.validationError('asset', 'Not supported asset: ' + asset)
            return fetchActiveUsdcMarkets()
        })
}