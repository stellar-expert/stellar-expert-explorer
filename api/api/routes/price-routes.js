const {registerRoute} = require('../router'),
    apiCache = require('../api-cache'),
    priceTracker = require('../../business-logic/ticker/price-tracker')

apiCache.createBucket('price', 100, '2 minutes')

module.exports = function (app) {
    registerRoute(app,
        'xlm-price',
        {cors: 'open', cache: 'price'},
        req => priceTracker.getDailyPrices(req.params.network, req.path, req.query))
}