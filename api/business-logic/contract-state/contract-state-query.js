const {StrKey, xdr} = require('@stellar/stellar-sdk')
const config = require('../../app.config.json')
const db = require('../../connectors/mongodb-connector')
const elastic = require('../../connectors/elastic-connector')
const {computeHash} = require('../../utils/sha256')
const {preparePagedData, normalizeLimit, normalizeOrder} = require('../api-helpers')
const {validateNetwork, validateAccountOrContractAddress} = require('../validators')
const errors = require('../errors')

/**
 * @param {String} network - Stellar network id
 * @param {String} basePath
 * @param {String} owner
 * @param {String} cursor
 * @param {String} durability
 * @param {Number} limit
 * @param {'asc'|'desc'} order
 * @return {Promise<MultiRows>}
 */
async function queryContractState(network, basePath, owner, {cursor, durability, limit, order}) {
    validateNetwork(network)
    validateAccountOrContractAddress(owner)
    if (durability && !['instance', 'persistent', 'temporary'].includes(durability))
        throw errors.validationError('durability', `Invalid durability: "${durability}".`)
    limit = normalizeLimit(limit)
    const parsedOrder = normalizeOrder(order, 1)
    //TODO: remove the following code when the db catches up with evictions
    const {_id: lastLedger} = await db[network].collection('ledgers').findOne({}, {
        sort: {_id: -1},
        projection: {_id: 1}
    })
    const filter = [{term: {owner}}]
    if (durability) {
        filter.push({term: {durability}})
    }
    if (cursor) {
        filter.push({
            range: {
                key: {
                    [parsedOrder === 1 ? 'gt' : 'lt']: cursor
                }
            }
        })
    }
    const queryRequest = {
        index: config.networks[network].stateIndex,
        size: limit,
        timeout: '3s',
        track_total_hits: limit + 1,
        sort: [{id: {order: parsedOrder === 1 ? 'asc' : 'desc'}}],
        query: {
            bool: {filter}
        }
    }
    const elasticResponse = await elastic.search(queryRequest)
    const dataEntries = elasticResponse.hits.hits.map(({_id, _source}) => {
        const entry = {
            key: _source.key,
            value: _source.value,
            durability: _source.durability,
            ttl: _source.ttl,
            updated: _source.updated,
            paging_token: _source.key
        }
        if (entry.ttl && entry.ttl < lastLedger) {
            entry.expired = true
        }
        return entry
    })

    return preparePagedData(basePath, {cursor, limit, order: parsedOrder === 1 ? 'asc' : 'desc'}, dataEntries)
}

async function fetchContractStateEntry(network, owner, key, durability) {
    validateNetwork(network)
    validateAccountOrContractAddress(owner)
    const contractDataKey = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
        contract: xdr.ScAddress.scAddressTypeContract(owner.startsWith('C') ?
            StrKey.decodeContract(owner) :
            StrKey.decodeEd25519PublicKey(owner)),
        key: parseContractDataKey(key),
        durability: durability === 'temporary' ?
            xdr.ContractDataDurability.temporary() :
            xdr.ContractDataDurability.persistent()
    })).toXDR()

    const keyHash = computeHash(contractDataKey, 'base64')
    const queryRequest = {
        index: config.networks[network].stateIndex,
        id: keyHash
    }
    const res = await elastic.get(queryRequest)
    if (!res.found)
        throw errors.notFound()
    const {_source} = res
    return {
        key: _source.key,
        value: _source.value,
        parent: owner,
        durability: _source.durability,
        ttl: _source.ttl,
        updated: _source.updated
    }
}

function parseContractDataKey(rawKey) {
    try {
        return xdr.ScVal.fromXDR(rawKey, 'base64')
    } catch (e) {
        throw errors.validationError('key', 'Invalid contract data key: ' + rawKey)
    }
}

async function countContractStateEntries(network, owner) {
    const queryRequest = {
        index: config.networks[network].stateIndex,
        query: {term: {owner}}
    }
    const res = await elastic.count(queryRequest)
    return res.count
}

module.exports = {queryContractState, fetchContractStateEntry, countContractStateEntries}