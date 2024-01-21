const db = require('../../connectors/mongodb-connector')
const {normalizeOrder} = require('../api-helpers')
const {validateNetwork} = require('../validators')

async function queryProtocolHistory(network, {order}) {
    validateNetwork(network)

    const records = await db[network].collection('protocol_versions')
        .find({})
        .sort({_id: normalizeOrder(order)})
        .toArray()

    return records.map(record => ({
        sequence: record._id,
        version: record.version,
        ts: record.ts,
        max_tx_set_size: record.maxTxSetSize,
        base_fee: record.baseFee,
        base_reserve: record.baseReserve,
        config_changes: record.config
    }))
}

module.exports = {queryProtocolHistory}