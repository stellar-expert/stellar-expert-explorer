const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const {normalizeLimit, normalizeOrder, preparePagedData} = require('../api-helpers')
const {resolveContractId} = require('./contract-resolver')

async function queryContractVersions(network, basePath, contract, {cursor, limit, order}) {
    validateNetwork(network)
    const contractId = await resolveContractId(network, contract)
    limit = normalizeLimit(limit)

    const parsedOrder = normalizeOrder(order, 1)
    let query = {contract: {$in: [contract, contractId]}}
    if (cursor) {
        const parsedCursor = Buffer.from(cursor, 'base64')
        const condition = parsedOrder === 1 ? {$gt: parsedCursor} : {$lt: parsedCursor}
        query = {$and: [query, {_id: condition}]}
    }

    //fetch data entries
    let versions = await db[network].collection('contract_wasm_history')
        .find(query)
        .sort({ts: parsedOrder})
        .limit(limit)
        .project({_id: 1, wasm: 1, op: 1, ts: 1})
        .toArray()

    versions = versions.map(v => ({
        wasm: v.wasm.buffer.toString('hex'),
        operation: v.op,
        ts: v.ts,
        paging_token: v._id.buffer.toString('base64')
    }))
    return preparePagedData(basePath, {cursor, limit, order: parsedOrder === 1 ? 'asc' : 'desc'}, versions)
}

module.exports = {queryContractVersions}