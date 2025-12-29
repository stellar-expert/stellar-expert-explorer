const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateContractAddress} = require('../validators')
const {normalizeLimit, normalizeOrder, preparePagedData} = require('../api-helpers')

async function queryContractVersions(network, basePath, contract, {cursor, limit, order}) {
    validateNetwork(network)
    validateContractAddress(contract)
    limit = normalizeLimit(limit)

    const parsedOrder = normalizeOrder(order, 1)
    let query = {entry: contract}
    if (cursor) {
        query._id = {[parsedOrder === 1 ? '$gt' : '$lt']: cursor}
    }

    //fetch data entries
    let versions = await db[network].collection('contract_wasm_history')
        .find(query)
        .sort({ts: parsedOrder})
        .limit(limit)
        .project({_id: 1, hash: 1, op: 1, ts: 1})
        .toArray()

    versions = versions.map(v => ({
        wasm: v.hash.buffer.toString('hex'),
        operation: v.op,
        ts: v.ts,
        paging_token: v._id
    }))
    return preparePagedData(basePath, {cursor, limit, order: parsedOrder === 1 ? 'asc' : 'desc'}, versions)
}

module.exports = {queryContractVersions}