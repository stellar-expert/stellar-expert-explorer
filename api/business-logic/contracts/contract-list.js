const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const {preparePagedData, normalizeLimit, normalizeOrder} = require('../api-helpers')
const {aggregateContractHistory} = require('./contract-aggregation')
const {serializeContractStats} = require('./contract-stats')

async function queryAllContracts(network, basePath, {search, sort = 'created', order, cursor, limit}) {
    validateNetwork(network)
    limit = normalizeLimit(limit, 10, 20)
    const normalizedOrder = normalizeOrder(order, 1)

    if (search) {
        //search a single contract
        if (StrKey.isValidContract(search)) {
            const contract = await db[network].collection('contracts').findOne({_id: search})
            let batch
            if (!contract) {
                batch = []
            } else {
                batch = [{
                    contract: contract._id,
                    address: contract._id,
                    created: contract.created,
                    creator: contract.creator,
                    wasm: contract.wasm,
                    ...aggregateContractHistory(contract.history)
                }]
            }
            return preparePagedData(basePath, {sort: 'created', order: normalizedOrder, cursor: 0, limit}, batch)
        }
        //TODO: implement search by protocol and home domain
        /*const q = new QueryBuilder({$text: {$search: search.trim()}})
            .setSkip(calculateSequenceOffset(0, limit, cursor, 'asc'))
            .setLimit(limit, 20)

        //score should have the highest priority
        const sortOrder = {score: {$meta: 'textScore'}}
        const directoryEntries = await db.public.collection('directory')
            .find(q.query)
            .sort(sortOrder)
            .skip(q.skip)
            .limit(q.limit)
            .project({_id: 1})
            .toArray()

        const idsToSearch = directoryEntries.map(di => di._id)*/
    }

    const collection = db[network].collection('contracts')
    let query
    const filter = {}
    switch (sort) {
        case 'created':
        default:
            if (cursor) {
                cursor = parseInt(cursor, 10)
                if (cursor > 0) {
                    filter._id = normalizedOrder === 1 ? {$gt: cursor} : {$lt: cursor}
                }
            }
            query = collection.find(filter).sort({_id: normalizedOrder})
            break
    }

    let contracts = await query.limit(limit).toArray()

    contracts = contracts.map(contract => {
        const res = serializeContractStats(contract)
        res.paging_token = contract._id.toString()
        return res
    })

    return preparePagedData(basePath, {sort, order, cursor, limit}, contracts)
}

module.exports = {queryAllContracts}