const {registerRoute} = require('../router')
const {normalizeLimit} = require('../../business-logic/api-helpers')
const {queryLedgerStats, query24HLedgerStats} = require('../../business-logic/ledger/ledger-stats')
const {queryProtocolHistory} = require('../../business-logic/ledger/protocol-versions')
const {queryTsFromSequence, querySequenceFromTs} = require('../../business-logic/ledger/ledger-timestamp-resolver')
const {fetchArchiveLedger, fetchArchiveLedgers} = require('../../business-logic/archive/archive-locator')
const {fetchLastLedger, fetchLedger, fetchLastNLedgers} = require('../../business-logic/ledger/ledger-resolver')
const {waitForLedger} = require('../../business-logic/ledger/ledger-stream')

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
        ({params, query}) => queryTsFromSequence(params.network, query))

    registerRoute(app,
        'ledger/sequence-from-timestamp',
        {cache: 'stats', cors: 'open'},
        ({params, query}) => querySequenceFromTs(params.network, query))

    registerRoute(app,
        'ledger/stream',
        {},
        ({params}) => waitForLedger(params.network))

    registerRoute(app,
        'ledger/last',
        {},
        async ({params}) => prepareLedgerData(params.network, await fetchLastLedger(params.network)))

    registerRoute(app,
        'ledger/lastn',
        {},
        async ({params, query}) => {
            const count = normalizeLimit(query.limit, 10, 200)
            const ledgers = await fetchLastNLedgers(params.network, count)
            const archiveLedgers = await fetchArchiveLedgers(params.network, ledgers[0]._id, count)
            const res = []
            for (let i = 0; i < ledgers.length; i++) {
                res.push(await prepareLedgerData(params.network, ledgers[i], archiveLedgers[i]))
            }
            return res

        })

    registerRoute(app,
        'ledger/:sequence',
        {},
        async ({params}) => prepareLedgerData(params.network, await fetchLedger(params.network, parseInt(params.sequence, 10))))
}

async function prepareLedgerData(network, stats, archiveLedger) {
    if (!stats)
        return null
    if (!archiveLedger) {
        archiveLedger = await fetchArchiveLedger(network, stats?._id)
    }
    if (stats?._id !== archiveLedger?.sequence)
        throw new Error('Ledgers mismatch')
    const res = {
        sequence: stats.sequence,
        ts: stats.ts,
        protocol: stats.version,
        xlm: stats.xlm.toString(),
        fee_pool: stats.pool.toString(),
        successful_transactions: stats.tx,
        failed_transactions: stats.failed,
        successful_operations: stats.ops,
        failed_operations: stats.fops,
        ...archiveLedger
    }
    if (stats.fees) {
        res.fees = {
            bids: formatFees(stats.bids),
            charged: formatFees(stats.fees)
        }
        res.capacity = stats.capacity
    }
    return res
}

const percentileThresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99]

function formatFees(fees) {
    const res = {
        min: fees[0],
        max: fees[fees.length - 1]
    }
    for (let i = 0; i < percentileThresholds.length; i++) {
        res['p' + percentileThresholds[i]] = fees[i + 1]
    }
    return res
}