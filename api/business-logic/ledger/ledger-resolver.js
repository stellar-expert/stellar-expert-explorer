const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const {normalizeLimit} = require('../api-helpers')

/**
 * Fetch multiple ledgers from analytics db
 * @param {String} network - Stellar network
 * @param {Number[]} sequences - Ledger sequences to fetch
 * @return {Promise<{}[]>}
 */
async function fetchLedgers(network, sequences) {
    validateNetwork(network)
    return await db[network].collection('ledgers').find({_id: {$in: sequences}}).toArray()
}

/**
 * Fetch single ledger from analytics db
 * @param {String} network - Stellar network
 * @param {Number} sequence - Ledger sequences to fetch
 * @return {Promise<{}>}
 */
async function fetchLedger(network, sequence) {
    validateNetwork(network)
    return await db[network].collection('ledgers').findOne({_id: sequence})
}

/**
 * Fetch the most recent ledger processed by the network
 * @param {String} network
 * @return {Promise<{}>}
 */
async function fetchLastLedger(network) {
    validateNetwork(network)
    return await db[network].collection('ledgers').findOne({}, {sort: {_id: -1}})
}

/**
 * Fetch N most recent ledgers processed by the network
 * @param {String} network - Stellar network
 * @param {Number} count - Number of ledgers to fetch
 * @return {Promise<{}>}
 */
async function fetchLastNLedgers(network, count) {
    validateNetwork(network)
    const res = await db[network].collection('ledgers').find({}, {sort: {_id: -1}, limit: count}).toArray()
    return res.reverse()
}

module.exports = {fetchLedgers, fetchLedger, fetchLastLedger, fetchLastNLedgers}