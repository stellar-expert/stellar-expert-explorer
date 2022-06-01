const db = require('../../connectors/mongodb-connector'),
    {validateNetwork} = require('../validators')

async function queryLedgerStats(network) {
    validateNetwork(network)
    const query = db[network].collection('network_stats')
        .find({_id: {$gte: 0}})
        .sort({_id: 1})
    const data = await query.toArray()

    for (let entry of data) {
        entry.ts = entry._id
        entry._id = undefined
    }
    data[0].total_xlm = data[0].reserve
    return data
}

async function query24HLedgerStats(network) {
    validateNetwork(network)
    const entry = await db[network].collection('network_stats')
        .findOne({_id: -1})

    entry.successful_transactions = entry.transactions
    delete entry._id
    delete entry.finalized
    delete entry.transactions

    return entry
}

module.exports = {queryLedgerStats, query24HLedgerStats}