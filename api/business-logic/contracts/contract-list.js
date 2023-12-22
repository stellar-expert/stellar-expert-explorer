const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {validateNetwork} = require('../validators')
const errors = require('../errors')
const {addPagingToken, calculateSequenceOffset, preparePagedData} = require('../api-helpers')

const contractProjectedFields = {
    address: 1,
    created: 1,
    payments: 1,
    trades: 1,
    _id: 0
}

async function queryAllContracts(network, basePath, {search, cursor, limit, skip}) {
    validateNetwork(network)

    if (!search)
        throw errors.notFound()
    //search a single contract
    if (StrKey.isValidContract(search)) {
        const contract = await db[network]
            .collection('contracts')
            .findOne({address: search}, {projection: contractProjectedFields})
        let batch
        if (!contract) {
            batch = []
        } else {
            batch = [{
                account: contract.address,
                created: contract.created,
                payments: contract.payments,
                trades: contract.trades
            }]
        }
        return preparePagedData(basePath, {sort: 'address', order: 'asc', cursor: 0, limit}, batch)
    }
    if (skip > 1000) {
        skip = 1000
    }

    const q = new QueryBuilder({$text: {$search: search.trim()}})
        .setSkip(calculateSequenceOffset(skip, limit, cursor, 'asc'))
        .setLimit(limit, 20)

    q.addQueryFilter({})
    //score should have the highest priority
    const sortOrder = {score: {$meta: 'textScore'}}
    const directoryEntries = await db.public.collection('directory')
        .find(q.query)
        .sort(sortOrder)
        .skip(q.skip)
        .limit(q.limit)
        .project({_id: 1})
        .toArray()

    const idsToSearch = directoryEntries.map(di => di._id)

    const contracts = await db[network].collection('contracts')
        .find({address: {$in: idsToSearch}})
        .project(contractProjectedFields)
        .toArray()

    const res = idsToSearch.map(d => {
        let contract = contracts.find(a => a.address === d)
        if (!contract) {
            contract = {address: d, payments: 0, trades: 0, created: 0}
        }
        contract.account = contract.address
        delete contract.address
        return contract
    })
    addPagingToken(res, q.skip)
    return preparePagedData(basePath, {sort: 'score', order: 'asc', cursor: q.skip, limit: q.limit}, res)
}

module.exports = {queryAllContracts}