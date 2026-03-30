const db = require('../../connectors/mongodb-connector')
const ShardedElasticQuery = require('../../connectors/sharded-elastic-query')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {validateNetwork, validateContractAddress} = require('../validators')
const errors = require('../errors')

/**
 *
 * @param {string} network
 * @param {EventQueryParams} queryFilter
 * @param {string} basePath
 * @param {string} [order]
 * @param {string} [cursor]
 * @param {number} [limit]
 * @param {{}} [otherQueryParams]
 * @returns {Promise<MultiRows>}
 */
async function queryEvents(network, queryFilter, basePath, {order, cursor, limit, ...otherQueryParams}) {
    validateNetwork(network)
    order = normalizeOrder(order, -1) === 1 ? 'asc' : 'desc'
    limit = normalizeLimit(limit, 20, 200)
    const elasticQuery = new ShardedElasticQuery(network, 'eventIndex')

    queryFilter.addCursorFilter(order, cursor)
    let rows = await elasticQuery.search({
        filter: queryFilter.filter,
        limit,
        order,
        sort: 'id',
        minYear: queryFilter.minYear,
        maxYear: queryFilter.maxYear
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
    return preparePagedData(basePath, {order, cursor, limit, ...otherQueryParams}, rows)
}

async function queryContractEvents(network, contract, basePath, query) {
    validateNetwork(network)
    contract = validateContractAddress(contract)
    const contractInfo = await db[network].collection('contracts').findOne({_id: contract}, {projection: {_id: 1}})
    if (!contractInfo)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified the asset identifier correctly.')
    const filter = new EventQueryParams([{term: {contract}}]).addQueryFilters(query)
    return await queryEvents(network, filter, basePath, query)
}


class EventQueryParams {
    constructor(filter = []) {
        this.filter = filter
    }

    /**
     * @type {Object[]}
     * @readonly
     */
    filter
    /**
     * @type {number}
     * @readonly
     */
    minYear
    /**
     * @type {number}
     * @readonly
     */
    maxYear

    /**
     * Add filters to the query
     * @param {Object} query
     * @returns {EventQueryParams}
     */
    addQueryFilters(query = {}) {
        this.addTopicsFilter(query)
        this.addTsFilter(query)
        return this
    }

    /**
     * Add cursor filter to the query
     * @param {'asc'|'desc'} order
     * @param {string} [cursor]
     */
    addCursorFilter(order, cursor) {
        if (!cursor)
            return  //TODO: automatically determine min/max year based on cursor
        const condition = order === 'asc' ? 'gt' : 'lt'
        this.filter.push({range: {id: {[condition]: cursor}}})
    }

    /**
     * Add topics filter to the query
     * @param {string[]|string} [topic]
     * @private
     */
    addTopicsFilter({topic}) {
        if (!topic)
            return
        if (!(topic instanceof Array)) {
            topic = [topic]
        }
        this.filter.push({
            terms_set: {
                topics: {
                    terms: topic,
                    minimum_should_match: topic.length
                }
            }
        })
    }

    /**
     * Add timestamp filter to the query
     * @param {number|string} [from]
     * @param {number|string} to
     * @private
     */
    addTsFilter({from, to}) {
        if (from === undefined && to === undefined)
            return
        const range = {}
        if (to !== undefined) {
            range.lte = parseInt(to, 10)
            this.maxYear = new Date(range.lte * 1000).getUTCFullYear()
        }
        if (from !== undefined) {
            range.gt = parseInt(from, 10)
            this.minYear = new Date(range.gt * 1000).getUTCFullYear()
        }
        this.filter.push({range: {ts: range}})
    }
}

module.exports = {
    queryContractEvents
}