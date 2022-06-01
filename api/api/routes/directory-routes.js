const {registerRoute} = require('../router'),
    apiCache = require('../api-cache'),
    directoryManager = require('../../business-logic/directory/directory-manager')

module.exports = function (app) {
    apiCache.createBucket('directory', 500, '20 seconds')

    const privateRouteOptions = {
        prefix: '/explorer/',
        cors: 'whitelist'
    }

    const publicRouteOptions = {
        ...privateRouteOptions,
        cors: 'open',
        cache: 'directory'
    }


    registerRoute(app, 'directory', publicRouteOptions, req => directoryManager.listDirectory(req.path, req.query))

    registerRoute(app, 'directory/tags', publicRouteOptions, req => directoryManager.listTags())

    registerRoute(app, 'directory/blocked-domains', publicRouteOptions, req => directoryManager.listBlockedDomains(req.path, req.query))

    registerRoute(app, 'directory/blocked-domains/:domain', publicRouteOptions, req => directoryManager.isDomainBlocked(req.params.domain))

    registerRoute(app, 'directory/block-domain', {method: 'post', ...privateRouteOptions}, req => directoryManager.blockDomain(req.body))

    registerRoute(app, 'directory', {method: 'post', ...privateRouteOptions}, req => directoryManager.update(req.body))

    registerRoute(app, 'directory/:address', publicRouteOptions, req => directoryManager.get(req.params.address, !!req.query.extended))

    registerRoute(app, 'directory/:address/changes', privateRouteOptions, req => directoryManager.listChanges(req.path, req.params.address, req.query))

    registerRoute(app, 'directory/:address', {method: 'delete', ...privateRouteOptions}, req => directoryManager.delete(req.body))

    //legacy routes
    // -->
    registerRoute(app, 'public/directory', publicRouteOptions, req => directoryManager.listDirectory(req.path, req.query))

    registerRoute(app, 'public/directory/:address', publicRouteOptions, req => directoryManager.get(req.params.address, !!req.query.extended))

    registerRoute(app, 'testnet/directory', publicRouteOptions, req => directoryManager.listDirectory(req.path, req.query))

    registerRoute(app, 'testnet/directory/:address', publicRouteOptions, req => directoryManager.get(req.params.address, !!req.query.extended))
    // <--
}