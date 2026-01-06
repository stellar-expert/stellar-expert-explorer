const elastic = require('./elastic-connector')
const config = require('../app.config.json')

/** @typedef {{}} ShardedElasticQueryParams
 * @property {{}} filter
 * @property {Number} [limit]
 * @property {String} [sort]
 * @property {'asc'|'desc'} [order]
 * @property {String[]} [fields]
 * @property {{}} [aggs]
 * @property {Boolean} [excludeSource]
 * @property {Number} [minYear]
 * @property {Number} [maxYear]
 */

class ShardedElasticQuery {
    /**
     * @param {'public'|'testnet'} network
     * @param {'opIndex'|'tradeIndex'|'invocationIndex'|'errorIndex'|'eventIndex'} indexKey
     */
    constructor(network, indexKey) {
        this.indexKey = indexKey
        this.network = network
    }

    /**
     * @type {string}
     * @readonly
     */
    network
    /**
     * @type {String}
     * @readonly
     */
    indexKey

    /**
     * @param {ShardedElasticQueryParams} queryRequest
     * @return {Promise<[]>}
     */
    async search(queryRequest) {
        let {limit} = queryRequest
        let remaining = limit
        let res = []
        const query = this.prepareQuery(queryRequest)
        const years = this.prepareYearsList(queryRequest)
        await this.queryElastic(query, 'search', years, elasticResponse => {
            const data = queryRequest.aggs ?
                [elasticResponse.aggregations] : //TODO: automatically merge agg results from all shards here
                elasticResponse.hits.hits
            if (data.length) {
                res = res.concat(data)
                if (limit) {
                    remaining -= data.length
                    if (remaining <= 0)
                        return false
                }
            }
            return true
        })
        return res
    }

    /**
     * @param {ShardedElasticQueryParams} queryRequest
     * @return {Promise<Number>}
     */
    async count(queryRequest) {
        const query = this.prepareCountQuery(queryRequest)
        const years = this.prepareYearsList(queryRequest)
        let res = 0
        await this.queryElastic(query, 'count', years, elasticResponse => {
            res += elasticResponse.count
            return true
        })
        return res
    }

    /**
     * @param {{}} query
     * @param {'search'|'count'} method
     * @param {number[]} years
     * @param {function} dataCallback
     * @return {Promise}
     * @private
     */
    async queryElastic(query, method, years, dataCallback) {
        for (const year of years) {
            query.index = this.generateIndexName(year)
            const elasticResponse = await elastic[method](query)
            const shouldContinue = dataCallback(elasticResponse)
            if (!shouldContinue)
                break
        }
    }

    /**
     * @param {ShardedElasticQueryParams} queryRequest
     * @return {Number[]}
     * @private
     */
    prepareYearsList(queryRequest) {
        const from = queryRequest.minYear || elastic.getIndexLowerBoundary(this.network, this.indexKey)
        const to = queryRequest.maxYear || new Date().getUTCFullYear()
        const years = new Array(to - from + 1).fill(0)
        return queryRequest.order === 'desc' ?
            years.map((v, i) => to - i) :
            years.map((v, i) => from + i)
    }

    /**
     * @private
     */
    prepareQuery({filter, limit = 20, sort = 'id', order = 'asc', fields, aggs, excludeSource = false}) {
        const res = {
            query: {bool: {filter}},
            size: limit,
            timeout: '3s',
            track_total_hits: limit + 1,
            sort: [{[sort]: {order}}]
        }
        if (excludeSource) {
            res._source = false
        }
        if (fields) {
            res.fields = fields
        }
        if (aggs) {
            res.aggs = aggs
        }
        return res
    }

    /**
     * @private
     */
    prepareCountQuery({filter}) {
        return {
            query: {bool: {filter}}
        }
    }

    /**
     * @param {Number} year
     * @return {String}
     * @private
     */
    generateIndexName(year) {
        return config.networks[this.network][this.indexKey] + year
    }
}

module.exports = ShardedElasticQuery