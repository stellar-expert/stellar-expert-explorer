const {registerRoute} = require('../router')
const {queryLedgerStats, query24HLedgerStats} = require('../../business-logic/ledger/ledger-stats')
const {queryProtocolHistory} = require('../../business-logic/ledger/protocol-versions')
const {queryTimestampFromSequence, querySequenceFromTimestamp} = require('../../business-logic/ledger/ledger-timestamp-resolver')

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

    registerRoute(app,
        'ledger/timestamp-from-sequence',
        {cache: 'stats', cors: 'open'},
        ({params, query}) => queryTimestampFromSequence(params.network, query))

    registerRoute(app,
        'ledger/sequence-from-timestamp',
        {cache: 'stats', cors: 'open'},
        ({params, query}) => querySequenceFromTimestamp(params.network, query))

}