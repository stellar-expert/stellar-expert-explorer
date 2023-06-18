const db = require('../../connectors/mongodb-connector')

/**
 * Fetch multiple ledgers from analytics db
 * @param {String} network - Stellar network
 * @param {Number[]} sequences - Ledger sequences to fetch
 * @param {{}} [projection] - Query projection (optional)
 * @return {Promise<{}[]>}
 */
async function fetchLedgers(network, sequences, projection = null) {
    return await db[network].collection('ledgers').find({_id: {$in: sequences}}).toArray()
}

module.exports = {fetchLedgers}