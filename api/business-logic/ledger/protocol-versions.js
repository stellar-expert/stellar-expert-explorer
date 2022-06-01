const db = require('../../connectors/mongodb-connector'),
    {normalizeOrder} = require('../api-helpers'),
    {validateNetwork} = require('../validators'),
    errors = require('../errors')

async function queryProtocolHistory(network, {order}) {
    validateNetwork(network)

    const records = await db[network].collection('protocol_versions')
        .find({})
        .sort({_id: normalizeOrder(order)})
        .toArray()

    return records.map(({_id, version, baseFee, baseReserve, maxTxSetSize, ts}) => ({
        sequence: _id,
        version,
        ts,
        maxTxSetSize,
        baseFee,
        baseReserve
    }))
}

module.exports = {queryProtocolHistory}