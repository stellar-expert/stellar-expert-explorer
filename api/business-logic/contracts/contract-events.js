const db = require('../../connectors/mongodb-connector')
const ShardedElasticQuery = require('../../connectors/sharded-elastic-query')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {validateNetwork, validateContractAddress} = require('../validators')
const errors = require('../errors')

async function queryEvents(network, queryFilter, basePath, {order, cursor, limit}) {
    validateNetwork(network)
    order = normalizeOrder(order, -1) === 1 ? 'asc' : 'desc'
    limit = normalizeLimit(limit, 20, 200)
    const elasticQuery = new ShardedElasticQuery(network, 'eventIndex')

    if (cursor) {
        //TODO: automatically determine min/max year based on cursor
        queryFilter.push({range: {id: {[order === 'asc' ? 'gt' : 'lt']: cursor}}})
    }
    let rows = await elasticQuery.search({
        filter: queryFilter,
        limit,
        order,
        sort: 'id'
    })

    rows = rows.map(({_source}) => {
        const {id, contract, initiator, topics, topicsXdr, bodyXdr, ts} = _source
        return {
            id,
            ts,
            contract,
            initiator,
            topics,
            topicsXdr,
            bodyXdr,
            paging_token: id
        }
    })
    return preparePagedData(basePath, {order, cursor, limit}, rows)
}

async function queryContractEvents(network, contract, basePath, query) {
    validateNetwork(network)
    contract = validateContractAddress(contract)
    const contractInfo = await db[network].collection('contracts').findOne({_id: contract}, {projection: {_id: 1}})
    if (!contractInfo)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified the asset identifier correctly.')
    const filter = [{term: {contract}}]
    let {topic} = query
    if (topic) {
        if (!(topic instanceof Array)) {
            topic = [topic]
        }
        filter.push({
            terms_set: {
                topics: {
                    terms: topic,
                    minimum_should_match: topic.length
                }
            }
        })
    }
    return await queryEvents(network, filter, basePath, query)
}

module.exports = {
    queryContractEvents
}