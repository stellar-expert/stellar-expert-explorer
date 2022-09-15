const {registerRoute} = require('../router')
const {fetchDomainMeta} = require('../../business-logic/domain-meta/domain-meta-info')

module.exports = function (app) {
    registerRoute(app,
        'domain-meta',
        {cache: 'stats', cors: 'open'},
        ({params, query}) => fetchDomainMeta(params.network, query.domain))
}