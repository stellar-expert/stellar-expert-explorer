const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const {queryAccountRelations, queryAccountRelationsStats} = require('../../business-logic/relations/relations')

apiCache.createBucket('relations', 5000, '5 minutes')

module.exports = function (app) {
    registerRoute(app,
        'relations/:account/stats',
        {cache: 'relations'},
        ({params, query}) => queryAccountRelationsStats(params.network, params.account, query.asset))

    registerRoute(app,
        'relations/:account',
        {cache: 'relations'},
        ({params, query, path}) => queryAccountRelations(params.network, params.account, path, query))
}