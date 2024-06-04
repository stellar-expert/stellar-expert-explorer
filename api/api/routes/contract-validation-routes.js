const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const {validateContract, validateContractCallback, enqueueValidation} = require('../../business-logic/contracts/contract-validation')

apiCache.createBucket('contract-validation', 5000, '5 minutes')

module.exports = function (app) {
    registerRoute(app,
        'contract-validation/match',
        {method: 'post'},
        req => enqueueValidation(req.params.network, req.body, req.ip))

    registerRoute(app,
        'contract-validation/validate',
        {method: 'post'},
        req => validateContract(req.params.network, req))

    registerRoute(app,
        'contract-validation/confirm/:uid',
        {method: 'post'},
        req => validateContractCallback(req.params.network, req.body, req.params.uid))
}