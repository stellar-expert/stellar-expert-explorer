const {registerRoute} = require('../router')
const {queryOfferTrades} = require('../../business-logic/dex/trades')
const {queryOfferDetails} = require('../../business-logic/dex/offer-stats')

module.exports = function (app) {
    registerRoute(app,
        'offer/:id',
        {cache: 'global-stats'},
        ({params, query}) => queryOfferDetails(params.network, params.id))

    registerRoute(app,
        'offer/:id/history/trades',
        {cache: 'tx'},
        ({params, query, path}) => {
            const {filter, network, id} = params
            return queryOfferTrades(network, id, path, query)
        })
}