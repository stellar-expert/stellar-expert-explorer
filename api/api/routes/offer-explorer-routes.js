const {registerRoute} = require('../router'),
    {queryOfferTrades} = require('../../business-logic/dex/trades'),
    {queryOfferOperations} = require('../../business-logic/operation/operations'),
    {queryOfferDetails} = require('../../business-logic/dex/offer-stats')

module.exports = function (app) {
    registerRoute(app,
        'offer/:id',
        {cache: 'global-stats'},
        ({params, query}) => queryOfferDetails(params.network, params.id))

    registerRoute(app,
        'offer/:id/history/:filter',
        {cache: 'operations'},
        ({params, query, path}) => {
            const {filter, network, id} = params
            if (filter === 'trades') return queryOfferTrades(network, id, path, query)
            return queryOfferOperations(network, id, filter, path, query)
        })
}