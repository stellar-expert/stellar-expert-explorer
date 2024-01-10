const {StrKey} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const {resolveAccountId} = require('../account/account-resolver')
const {resolveContractId} = require('../contracts/contract-resolver')
const {preparePagedData, normalizeLimit, normalizeOrder} = require('../api-helpers')
const {validateNetwork} = require('../validators')
const errors = require('../errors')

/**
 * @param {String} network - Stellar network id
 * @param {String} basePath
 * @param {String} parentAddress
 * @param {String} cursor
 * @param {Number} limit
 * @param {'asc'|'desc'} order
 * @return {Promise<MultiRows>}
 */
async function queryContractData(network, basePath, parentAddress, {cursor, limit, order}) {
    validateNetwork(network)
    const parentId = await fetchParentId(network, parentAddress)
    limit = normalizeLimit(limit)

    const parsedOrder = normalizeOrder(order, 1)
    let query = {
        _id: {
            $gte: generateContractDataIdFilter(parentId),
            $lt: generateContractDataIdFilter(parentId + 1)
        }
    }
    if (cursor) {
        const parsedCursor = parseCursor(cursor, parentId)
        const condition = parsedOrder === 1 ? {$gt: parsedCursor} : {$lt: parsedCursor}
        query = {$and: [query, {_id: condition}]}
    }

    //fetch data entries
    const dataEntries = await db[network].collection('contract_data')
        .find(query)
        .sort({_id: parsedOrder})
        .limit(limit)
        .project({_id: 1, key: 1, value: 1, updated: 1})
        .toArray()

    for (const entry of dataEntries) {
        entry.paging_token = entry._id.buffer.toString('base64')
        delete entry._id
    }

    return preparePagedData(basePath, {cursor, limit, order: parsedOrder === 1 ? 'asc' : 'desc'}, dataEntries)
}

async function fetchParentId(network, parent) {
    if (!StrKey.isValidEd25519PublicKey(parent) && !StrKey.isValidContract(parent))
        throw errors.validationError('parentId', 'Invalid parent contract/account address.')
    let id
    if (parent.startsWith('G')) {
        id = await resolveAccountId(network, parent)
    } else {
        id = await resolveContractId(network, parent)
    }
    if (id === null || id < 0)
        throw errors.validationError('parentId', 'Invalid parent contract/account address.')
    return id

}

function parseCursor(cursor, parentId) {
    try {
        const raw = Buffer.from(cursor, 'base64')
        if (raw.length !== 32)
            throw new Error('Invalid length')
        if (raw.readInt32BE() !== parentId)
            throw new Error('Cursor doesn\'t relate to the parent id')
        return raw
    } catch (e) {
        throw errors.validationError('cursor', 'Invalid paging cursor.')
    }
}

function generateContractDataIdFilter(contractId) {
    const id = Buffer.allocUnsafe(32)
    id.fill(0)
    id.writeInt32BE(contractId)
    return id
}

async function countContractData(network, parentId) {
    const count = await db[network].collection('contract_data')
        .count({
            _id: {
                $gte: generateContractDataIdFilter(parentId),
                $lt: generateContractDataIdFilter(parentId + 1)
            }
        })
    return count
}

module.exports = {queryContractData, countContractData}