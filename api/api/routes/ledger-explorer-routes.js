const {registerRoute} = require('../router'),
    {queryLedgerStats, query24HLedgerStats} = require('../../business-logic/ledger/ledger-stats'),
    {queryProtocolHistory} = require('../../business-logic/ledger/protocol-versions')

module.exports = function (app) {
    registerRoute(app,
        'ledger/ledger-stats/24h',
        {cache: 'global-stats', cors: 'open'},
        ({params}) => query24HLedgerStats(params.network))

    registerRoute(app,
        'ledger/ledger-stats',
        {cache: 'global-stats'},
        ({params}) => queryLedgerStats(params.network))

    registerRoute(app,
        'ledger/protocol-history',
        {cache: 'global-stats'},
        ({params, query}) => queryProtocolHistory(params.network, query))
}