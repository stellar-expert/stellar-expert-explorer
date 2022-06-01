const {registerRoute} = require('../router'),
    apiCache = require('../api-cache'),
    {queryAssetTicker} = require('../../business-logic/ticker/asset-ticker')

apiCache.createBucket('asset-ticker', 5000, '30 seconds')

module.exports = function (app) {
    registerRoute(app,
        'ticker/:symbol',
        {cache: 'asset-ticker', cors: 'open'},
        ({params}) => queryAssetTicker(params.network, params.symbol))
}