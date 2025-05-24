const db = require('../../connectors/mongodb-connector')

/**
 * Fetch multiple ledgers from analytics db
 * @param {String} network - Stellar network
 * @param {Number[]} sequences - Ledger sequences to fetch
 * @return {Promise<{}[]>}
 */
async function fetchLedgers(network, sequences) {
    return await db[network].collection('ledgers').find({_id: {$in: sequences}}).toArray()
}

/**
 * Fetch multiple ledgers from analytics db
 * @param {String} network - Stellar network
 * @param {Number} sequence - Ledger sequences to fetch
 * @return {Promise<{}>}
 */
async function fetchLedger(network, sequence) {
    return await db[network].collection('ledgers').findOne({_id: sequence})
}

/**
 * Fetch the most recent ledger processed by the network
 * @param {String} network
 * @return {Promise<{}>}
 */
async function fetchLastLedger(network) {
    return await db[network].collection('ledgers').findOne({}, {sort: {_id: -1}})
}

module.exports = {fetchLedgers, fetchLedger, fetchLastLedger}