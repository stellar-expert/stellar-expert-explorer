const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const {queryAssetTicker} = require('../../business-logic/ticker/asset-ticker')

apiCache.createBucket('asset-ticker', 5000, '30 seconds')

module.exports = function (app) {
    registerRoute(app,
        'ticker/:symbol',
        {cache: 'asset-ticker', cors: 'open'},
        ({params}) => queryAssetTicker(params.network, params.symbol))
}