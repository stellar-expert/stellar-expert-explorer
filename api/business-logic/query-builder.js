const {Long} = require('bson')
const {parseDate} = require('../utils/date-utils')
const {normalizeOrder, normalizeLimit, normalizeSkip} = require('./api-helpers')
const {validateOfferId} = require('./validators')
const errors = require('./errors')

class QueryBuilder {
    constructor(initial) {
        this.query = {...initial}
    }

    /**
     * @type {Object}
     */
    query

    limit = 0

    skip = 0

    sort

    forAsset(asset, field = 'asset') {
        if (typeof asset !== 'number')
            throw errors.validationError('asset', 'Parameter "asset" is required.')
        this.query[field] = asset
        return this
    }

    forAccount(account) {
        if (typeof account !== 'number')
            throw errors.validationError('account', 'Parameter "account" is required.')
        this.query.account = account
        return this
    }

    forOffer(offerId) {
        validateOfferId(offerId)
        this.query.offerId = Long.fromString(offerId)
        return this
    }

    forPool(poolId) {
        if (typeof poolId !== 'number')
            throw errors.validationError('poolId', 'Parameter "poolId" is required.')
        this.query.poolId = poolId
        return this
    }

    addQueryFilter(filter) {
        Object.assign(this.query, filter)
        return this
    }

    setTimestampConstraints(constraints) {
        Object.assign(this.query, constraints.resolve())
        return this
    }

    setBefore(ts) {
        if (ts) {
            const parsed = parseDate(ts)
            if (parsed) {
                this.query.ts = {$lte: parsed}
            }
        }
        return this
    }

    setSkip(skip) {
        this.skip = normalizeSkip(skip)
        return this
    }

    setLimit(limit, maxAllowed = 200, defaultLimit = 10) {
        this.limit = normalizeLimit(limit, defaultLimit, maxAllowed)
        return this
    }

    setSort(sortField, order, defaultOrder = -1) {
        if (typeof sortField === 'object') {
            this.sort = {...this.sort, ...sortField}
            return this
        }
        this.sort = this.sort || {}
        this.sort[sortField] = normalizeOrder(order, defaultOrder)
        return this
    }
}

module.exports = QueryBuilder