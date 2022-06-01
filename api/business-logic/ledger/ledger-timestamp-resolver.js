const db = require('../../connectors/mongodb-connector')

let firstTs = {}

async function getFirstLedgerTimestamp(network) {
    if (firstTs[network] === undefined) {
        firstTs[network] = await db[network].collection('ledgers').findOne({}, {sort: {ts: 1}, projection: {ts: 1}})
    }
    return firstTs[network]
}

/**
 * Lookup a ledger sequence by the closest timestamp.
 * @param {String} network
 * @param {Number} ts
 * @return {Promise<undefined|*>}
 */
async function resolveSequenceFromTimestamp(network, ts) {
    if (ts > new Date().getTime() / 1000 - 1) return undefined
    const ledger = await db[network].collection('ledgers')
        .findOne({ts: {$lte: ts}}, {sort: {ts: -1}, projection: {_id: 1}})

    if (ledger) return ledger._id
    const first = await getFirstLedgerTimestamp(network)
    if (ts < first.ts) return undefined
    //looks like it's the last ledger
    const last = await db[network].collection('ledgers').findOne({}, {sort: {ts: -1}, projection: {_id: 1}})
    return last._id
}

/**
 * Lookup a timestamp for a given ledger by its sequence.
 * @param {String} network
 * @param {Number} sequence
 * @return {Promise<Number>}
 */
async function resolveTimestampFromSequence(network, sequence) {
    const ledger = await db[network].collection('ledgers')
        .findOne({_id: sequence}, {projection: {ts: 1, _id: 0}})

    if (ledger) return ledger.ts
    return undefined
}

module.exports = {resolveSequenceFromTimestamp, resolveTimestampFromSequence}