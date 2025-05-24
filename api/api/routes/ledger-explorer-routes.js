const {registerRoute} = require('../router')
const {queryLedgerStats, query24HLedgerStats} = require('../../business-logic/ledger/ledger-stats')
const {queryProtocolHistory} = require('../../business-logic/ledger/protocol-versions')
const {queryTimestampFromSequence, querySequenceFromTimestamp} = require('../../business-logic/ledger/ledger-timestamp-resolver')
const {fetchArchiveLedger} = require('../../business-logic/archive/archive-locator')
const {waitForLedger} = require('../../business-logic/ledger/ledger-stream')
const {fetchLastLedger, fetchLedger} = require('../../business-logic/ledger/ledger-resolver')

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
        async ({params}) => prepareLedgerData(params.network, await fetchLastLedger(params.network)))

    registerRoute(app,
        'ledger/:sequence',
        {},
        async ({params}) => prepareLedgerData(params.network, await fetchLedger(params.network, parseInt(params.sequence, 10))))
}

async function prepareLedgerData(network, stats) {
    if (!stats)
        return null
    const fromArchive = await fetchArchiveLedger(network, stats?._id)
    if (stats?._id !== fromArchive?.sequence)
        throw new Error('Ledgers mismatch')
    return {
        sequence: stats.sequence,
        ts: stats.ts,
        protocol: stats.version,
        xlm: stats.xlm.toString(),
        feePool: stats.pool.toString(),
        txSuccess: stats.tx,
        txFailed: stats.failed,
        operations: stats.ops,
        ...fromArchive
    }
}