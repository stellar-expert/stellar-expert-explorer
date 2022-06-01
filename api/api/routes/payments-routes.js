const {registerRoute} = require('../router'),
    apiCache = require('../api-cache'),
    {searchPayments} = require('../../business-logic/operation/payment-locator')

apiCache.createBucket('payments', 100, '4 seconds')

module.exports = function (app) {
    registerRoute(app,
        'payments',
        {cors: 'open', cache: 'payments'},
        req => searchPayments(req.params.network, req.path, req.query))
}