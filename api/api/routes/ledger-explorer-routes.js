const {registerRoute} = require('../router')
const {queryLedgerStats, query24HLedgerStats} = require('../../business-logic/ledger/ledger-stats')
const {queryProtocolHistory} = require('../../business-logic/ledger/protocol-versions')
const {queryTimestampFromSequence, querySequenceFromTimestamp} = require('../../business-logic/ledger/ledger-timestamp-resolver')
const {fetchArchiveLedger} = require('../../business-logic/archive/archive-locator')
const {waitForLedger} = require('../../business-logic/ledger/ledger-stream')
const {fetchLastLedger} = require('../../business-logic/ledger/ledger-resolver')

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

    registerRoute(app,
        'ledger/stream',
        {},
        ({params}) => waitForLedger(params.network))

    registerRoute(app,
        'ledger/last',
        {},
        ({params}) => fetchLastLedger(params.network).then(res => ({ledger: res._id})))

    registerRoute(app,
        'ledger/:sequence',
        {},
        ({params}) => fetchArchiveLedger(params.network, params.sequence))

}