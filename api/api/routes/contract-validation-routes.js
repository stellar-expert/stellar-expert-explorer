const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const {enqueueValidation} = require('../../business-logic/contracts/contract-validation')

apiCache.createBucket('contract-validation', 5000, '5 minutes')

module.exports = function (app) {
    registerRoute(app,
        'contract-validation/match',
        {method: 'post'},
        req => enqueueValidation(req.params.network, req.body, req.ip))
}