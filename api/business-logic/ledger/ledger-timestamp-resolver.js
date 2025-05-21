const db = require('../../connectors/mongodb-connector')
const {unixNow, parseDate} = require('../../utils/date-utils')
const {validateNetwork} = require('../validators')
const errors = require('../errors')
const {fetchLastLedger} = require('./ledger-resolver')

const firstTs = {}

async function getFirstLedgerTimestamp(network) {
    if (firstTs[network] === undefined) {
        firstTs[network] = await db[network].collection('ledgers').findOne({}, {sort: {ts: 1}, projection: {ts: 1}})
    }
    return firstTs[network]
}

/**
 * Lookup a ledger sequence by the closest timestamp.
 * @param {String} network - Network name
 * @param {Number} ts - UNIX timestamp to search
 * @return {Promise<Number>} - Sequence of the ledger closest to the given timestamp
 */
async function resolveSequenceFromTimestamp(network, ts) {
    if (ts > unixNow() - 1) {
        //looks like it's the last ledger
        const last = await fetchLastLedger(network)
        return last._id
    }
    const ledger = await db[network].collection('ledgers')
        .findOne({ts: {$lte: ts}}, {sort: {ts: -1}, projection: {_id: 1}})

    if (ledger)
        return ledger._id
    const first = await getFirstLedgerTimestamp(network)
    if (ts < first.ts) return undefined
    return first.ts

}

/**
 * Lookup a timestamp for a given ledger by its sequence.
 * @param {String} network - Network name
 * @param {Number} sequence - Ledger sequence to search
 * @return {Promise<Number>} - Ledger UNIX timestamp
 */
async function resolveTimestampFromSequence(network, sequence) {
    const ledger = await db[network].collection('ledgers')
        .findOne({_id: sequence}, {projection: {ts: 1, _id: 0}})

    if (ledger) return ledger.ts
    return undefined
}

function queryTimestampFromSequence(network, query) {
    validateNetwork(network)
    const sequence = parseInt(query.sequence, 10)
    if (isNaN(sequence) || sequence < 0 || sequence > 2147483647)
        throw errors.validationError('sequence')
    return resolveTimestampFromSequence(network, sequence)
        .then(ts => {
            if (ts === undefined)
                throw errors.notFound(`Ledger with sequence ${sequence} not found`)
            return {
                sequence,
                timestamp: ts,
                date: new Date(ts * 1000).toISOString()
            }
        })
}

async function querySequenceFromTimestamp(network, query) {
    validateNetwork(network)
    const ts = parseDate(query.timestamp)
    if (isNaN(ts) || ts === null || ts < 0 || ts > 2147483647)
        throw errors.validationError('timestamp')
    if (ts > unixNow() - 1)
        throw errors.badRequest('Cannot resolve ledgers from the timestamp in the future')
    let ledger = await db[network].collection('ledgers')
        .findOne({ts: {$lte: ts}}, {sort: {ts: -1}, projection: {_id: 1, ts: 1}})
    if (!ledger) {
        const firstLedger = await getFirstLedgerTimestamp(network)
        if (firstLedger > ts) {
            ledger = firstLedger
        }
    }
    if (!ledger)
        throw errors.notFound(`Ledger matching timestamp ${query.timestamp} not found`)
    return {
        sequence: ledger._id,
        timestamp: ledger.ts,
        date: new Date(ledger.ts * 1000).toISOString()
    }
}

module.exports = {resolveSequenceFromTimestamp, resolveTimestampFromSequence, queryTimestampFromSequence, querySequenceFromTimestamp}