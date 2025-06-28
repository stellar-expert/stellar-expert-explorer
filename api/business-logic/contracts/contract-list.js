const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const errors = require('../errors')
const {preparePagedData, normalizeLimit, normalizeOrder, calculateSequenceOffset} = require('../api-helpers')
const {resolveAccountAddress, AccountAddressJSONResolver} = require('../account/account-resolver')
const AssetDescriptor = require('../asset/asset-descriptor')
const {getValidationStatus} = require('./contract-validation')
const QueryBuilder = require('../query-builder')

const contractProjectedFields = {
    address: 1,
    created: 1,
    payments: 1,
    trades: 1,
    _id: 0
}

async function queryAllContracts(network, basePath, {search, sort = 'created', order, cursor, limit}) {
    validateNetwork(network)
    limit = normalizeLimit(limit, 10, 20)
    const normalizedOrder = normalizeOrder(order, 1)

    if (search) {
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
                    contract: contract.address,
                    address: contract.address,
                    created: contract.created,
                    creator: await resolveAccountAddress(network, contract.creator),
                    payments: contract.payments,
                    trades: contract.trades
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

    const accountResolver = new AccountAddressJSONResolver(network)
    contracts = await Promise.all(contracts.map(async contract => {
        const res = {
            contract: contract.address,
            address: contract.address,
            created: contract.created,
            creator: accountResolver.resolve(contract.creator),
            payments: contract.payments,
            trades: contract.trades
        }
        if (contract.wasm) {
            res.wasm = contract.wasm.toString('hex')
        }
        if (contract.issuer) {
            const issuerAddress = await resolveAccountAddress(network, contract.issuer)
            if (contract.code) {
                res.asset = new AssetDescriptor(contract.code + '-' + issuerAddress).toFQAN()
            } else {
                res.issuer = issuerAddress
                res.salt = contract.salt?.toString()
            }
        } else if (contract.code === 'XLM') {
            res.asset = 'XLM'
        } else if (await db[network].collection('assets').findOne({name: contract.address}, {projection: {_id: 1}})) {
            res.asset = contract.address
        }
        if (contract.wasm) {
            res.validation = await getValidationStatus(network, contract.wasm, true)
        }
        res.paging_token = contract._id.toString()
        return res
    }))

    await accountResolver.fetchAll()

    return preparePagedData(basePath, {sort, order, cursor, limit}, contracts)
}

module.exports = {queryAllContracts}