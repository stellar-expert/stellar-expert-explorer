const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const {queryAccountRelations} = require('../../business-logic/relations/relations')
const {loadRelationsMap, saveRelationsMap} = require('../../business-logic/relations/storage-map')

apiCache.createBucket('relations', 5000, '5 minutes')

module.exports = function (app) {
    registerRoute(app,
        'relations/:account',
        {cache: 'relations'},
        ({params, query, path}) => queryAccountRelations(params.network, params.account, path, query))


    registerRoute(app,
        'relations/storage-map/:address',
        {cache: 'relations', cors: 'open'},
        ({params}) => loadRelationsMap(params.address))
    registerRoute(app,
        'relations/storage-map/:address',
        {cache: 'relations', cors: 'open', method:'post'},
        ({params, body}) => saveRelationsMap(params.address, body))


}