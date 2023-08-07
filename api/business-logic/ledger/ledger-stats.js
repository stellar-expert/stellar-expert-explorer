const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')

async function queryLedgerStats(network) {
    validateNetwork(network)
    const query = db[network].collection('network_stats')
        .find({_id: {$gte: 0}})
        .sort({_id: 1})
    const data = await query.toArray()

    for (const entry of data) {
        entry.ts = entry._id
        delete entry._id
    }
    data[0].total_xlm = data[0].reserve
    if (!data[data.length - 1]?.reserve) {
        data[data.length - 1].reserve = data[data.length - 2].reserve
    }
    return data
}

async function query24HLedgerStats(network) {
    validateNetwork(network)
    let entry = await db[network].collection('network_stats')
        .findOne({_id: -1})

    if (!entry) {
        entry = await db[network].collection('network_stats')
            .findOne({}, {sort: {_id: -1}})
    }
    entry.successful_transactions = entry.transactions
    delete entry._id
    delete entry.finalized
    delete entry.transactions

    return entry
}

module.exports = {queryLedgerStats, query24HLedgerStats}