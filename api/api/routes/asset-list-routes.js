const {registerRoute} = require('../router')
const {querySAL} = require('../../business-logic/asset/asset-list')

module.exports = function (app) {
    registerRoute(app,
        'asset-list/top50',
        {cache: 'global-stats', cors: 'open'},
        ({params}) => querySAL(params.network))
}