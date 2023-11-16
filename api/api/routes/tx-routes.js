const {registerRoute} = require('../router')
const apiCache = require('../api-cache')
const TxQuery = require('../../business-logic/archive/tx-query')

apiCache.createBucket('tx', 4000, '10 seconds')

module.exports = function (app) {
    registerRoute(app,
        'tx',
        {cache: 'tx', billingCategory: 'txHistory'},
        ({params, path, query}) => new TxQuery(params.network, path, query).toArray())

    //transaction by id or hash
    registerRoute(app,
        'tx/:id',
        {cache: 'tx'},
        ({params}) => TxQuery.fetchTx(params.network, params.id))

    //transactions for a given ledger sequence
    registerRoute(app,
        'ledger/:sequence/tx',
        {cache: 'tx'},
        ({params}) => TxQuery.fetchLedgerTransactions(params.network, params.sequence))
}