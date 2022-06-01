const {registerRoute} = require('../router'),
    apiCache = require('../api-cache'),
    {queryAccountRelations} = require('../../business-logic/relations/relations')

apiCache.createBucket('relations', 5000, '5 minutes')

module.exports = function (app) {
    registerRoute(app,
        'relations/:account',
        {cache: 'relations'},
        ({params, query, path}) => queryAccountRelations(params.network, params.account, path, query))
}