const config = require('../../app.config.json')
const errors = require('../errors')
const db = require('../../connectors/mongodb-connector')
const elastic = require('../../connectors/elastic-connector')
const {parseGenericId} = require('../../utils/id-utils')
const Asset = require('../asset/asset-descriptor')
const {accountResolver} = require('../account/account-resolver')
const {validateNetwork, validateOfferId, validatePoolId, isValidContractAddress} = require('../validators')
const {preparePagedData, normalizeLimit, normalizeOrder} = require('../api-helpers')
const {resolveSequenceFromTimestamp, resolveTimestampFromSequence} = require('../ledger/ledger-timestamp-resolver')
const {fetchLedgers, fetchLedger} = require('../ledger/ledger-resolver')
const {fetchMemoIds} = require('../memo/memo-resolver')
const {fetchArchiveTransactions, fetchSingleArchiveTransaction, fetchArchiveLedgerTransactions} = require('./archive-locator')
const RangeConstraints = require('./range-constraints')

class TxQuery {
    constructor(network, basePath, {order = 'desc', cursor, limit, ...extraParams}) {
        validateNetwork(network)
        this.network = network
        this.basePath = basePath
        this.cursor = cursor
        if (order !== 'asc' && order !== 'desc')
            throw new errors.validationError('order', 'Invalid sorting order')
        this.order = order
        this.limit = normalizeLimit(limit)
        this.idConstraints = new RangeConstraints()
        this.yearConstraints = new RangeConstraints(elastic.indexBoundaries[network].min, new Date().getUTCFullYear())
        this.params = extraParams
    }

    /**
     * @type {String}
     */
    basePath
    /**
     * @type {String}
     */
    network
    /**
     * @type {RangeConstraints}
     */
    idConstraints
    /**
     * @type {RangeConstraints}
     */
    yearConstraints
    /**
     * @type {{}}
     */
    query
    /**
     * @type {'asc'|'desc'}
     */
    order
    /**
     * @type {Number}
     */
    limit
    /**
     * @type {String}
     */
    cursor
    /**
     * @type {String}
     */
    params

    /**
     * Apply cursor parameters
     * @private
     */
    async addCursorFilter() {
        if (!this.cursor)
            return
        try {
            const cursor = BigInt(this.cursor)
            if (cursor < 0n)
                return
            if (this.order === 'asc') {
                this.idConstraints.addBottomConstraint(cursor + 1n)
                try {
                    const ts = await resolveTimestampFromSequence(this.network, parseGenericId(cursor).ledger)
                    this.yearConstraints.addBottomConstraint(new Date(ts * 1000).getUTCFullYear())
                } catch (e) {
                }
            } else {
                this.idConstraints.addTopConstraint(cursor - 1n)
                try {
                    const ts = await resolveTimestampFromSequence(this.network, parseGenericId(cursor).ledger)
                    this.yearConstraints.addTopConstraint(new Date(ts * 1000).getUTCFullYear())
                } catch (e) {
                }
            }
        } catch (e) {
            throw errors.validationError('cursor', `Invalid paging cursor: "${this.cursor}".`)
        }
    }

    /**
     * Add "from" and "to" filter conditions
     * @return {Promise}
     * @private
     */
    async addTsFilter() {
        const {from, to} = this.params
        const promises = []
        if (to !== undefined) {
            const constraint = resolveSequenceFromTimestamp(this.network, parseInt(to, 10))
                .then(sequence => this.idConstraints.addTopConstraint(BigInt((sequence + 1) >>> 0) << 32n))
            promises.push(constraint)
            this.yearConstraints.addTopConstraint(new Date(to * 1000).getUTCFullYear())
        }
        if (from !== undefined) {
            const constraint = resolveSequenceFromTimestamp(this.network, parseInt(from, 10))
                .then(sequence => this.idConstraints.addBottomConstraint(BigInt(sequence >>> 0) << 32n))
            promises.push(constraint)
            this.yearConstraints.addBottomConstraint(new Date(from * 1000).getUTCFullYear())
        }
        if (promises.length) {
            await Promise.all(promises)
        }
    }

    /**
     * Add type filter conditions
     * @param {{}[]} filters - Filters aggregator
     * @private
     */
    addTypesFilter(filters) {
        let {type} = this.params
        if (!type)
            return
        type = enforceArray(type)
        if (type.length > 30)
            throw errors.validationError('type', `Too many type filters.`)
        const searchTypes = new Set()
        for (let i = 0; i < type.length; i++) {
            let value = type[i]
            if (typeof value === 'string') {
                //match op type by name or by group name
                const mapped = typeMapping[value]
                if (mapped !== undefined) {
                    if (mapped instanceof Array) {
                        for (const type of mapped) {
                            searchTypes.add(type)
                        }
                    } else {
                        searchTypes.add(mapped)
                    }
                    continue
                }
                //is it a numeric op type code?
                value = parseInt(value, 10)
            }
            if (typeof value !== 'number' || !(value >= 0 && value <= 26))
                throw errors.validationError('type', `Invalid type filter: ${value}.`)
            searchTypes.add(value)
        }
        if (searchTypes.size) {
            filters.push({terms: {type: Array.from(searchTypes)}})
        }
    }

    /**
     * Add "asset", "src_asset", "dest_asset" filter conditions
     * @param {{}[]} filters - Filters aggregator
     * @return {Promise}
     * @private
     */
    async addAssetFilter(filters) {
        for (const [param, key] of [['asset', 'assets'], ['src_asset', 'srcAsset'], ['dest_asset', 'desAsset']]) {
            let assets = this.params[param]
            if (!assets)
                continue
            assets = enforceArray(assets)
            if (!assets.length)
                continue
            if (assets.length > 10)
                throw errors.validationError(param, `Too many asset conditions.`)

            assets = assets.map(a => {
                try {
                    return new Asset(a).toFQAN()
                } catch (e) {
                    throw errors.validationError(param, `Invalid asset identifier: ${a.toString()}.`)
                }
            })
            const matchedAssets = await db[this.network].collection('assets')
                .find({name: {$in: assets}}, {projection: {_id: 1}}).toArray()

            const assetsFilter = []
            for (const matchedAsset of matchedAssets) {
                assetsFilter.push(matchedAsset._id)
            }

            if (!assetsFilter.length) {
                this.isUnfeasible = true
                continue
            }
            filters.push({terms: {[key]: assetsFilter}})
        }
    }

    /**
     * Add "account", "source", "destination" filter conditions
     * @param {{}[]} filters - Filters aggregator
     * @return {Promise}
     * @private
     */
    async addAccountFilter(filters) {
        for (const [param, key] of [['account', 'accounts'], ['source', 'source'], ['destination', 'destination']]) {
            let addresses = this.params[param]
            if (!addresses)
                continue
            addresses = enforceArray(addresses)
            if (!addresses.length)
                continue
            if (addresses.length > 10)
                throw errors.validationError(param, `Too many account conditions.`)

            for (const address of addresses) {
                if (typeof address !== 'string' || address.length !== 56)
                    throw errors.validationError(param, `Invalid account address: ${address}.`)
                const prefix = address[0]
                if (prefix !== 'G' && prefix !== 'C')
                    throw errors.validationError(param, `Invalid account address: ${address}.`)
            }

            let matchedAccounts = await accountResolver.resolveIds(this.network, addresses)
            matchedAccounts = matchedAccounts.filter(a => typeof a === 'number')

            if (!matchedAccounts.length) {
                this.isUnfeasible = true
                continue
            }
            filters.push({terms: {[key]: matchedAccounts}})
        }
    }

    /**
     * Add "offer" filter condition
     * @param {{}[]} filters - Filters aggregator
     * @private
     */
    addOfferFilter(filters) {
        let offers = this.params.offer
        if (!offers)
            return
        offers = enforceArray(offers)
        if (offers.length > 10)
            throw errors.validationError('offer', `Too many offer conditions.`)

        offers = offers.map(offer => validateOfferId(offer, 'offer').toString())
        if (!offers.length)
            return

        filters.push({terms: {offer: offers}})
    }

    /**
     * Add "pool" filter condition
     * @param {{}[]} filters - Filters aggregator
     * @return {Promise}
     * @private
     */
    async addPoolFilter(filters) {
        let pools = this.params.pool
        if (!pools)
            return
        pools = enforceArray(pools)
        if (pools.length > 10)
            throw errors.validationError('pool', `Too many pool conditions.`)

        for (const pool of pools) {
            validatePoolId(pool)
        }

        const matchedPools = await db[this.network].collection('liquidity_pools')
            .find({hash: {$in: pools}}, {projection: {_id: 1}}).toArray()

        if (!matchedPools.length) {
            this.isUnfeasible = true
            return
        }

        filters.push({terms: {pool: matchedPools.map(p => p._id)}})
    }

    /**
     * Add tx memo filter condition
     * @param {{}[]} filters - Filters aggregator
     * @return {Promise}
     * @private
     */
    async addMemoFilter(filters) {
        let memos = this.params.memo
        if (!memos)
            return
        memos = enforceArray(memos)
        if (!memos.length)
            return
        if (memos.length > 10)
            throw errors.validationError('memo', `Too many memo conditions.`)

        const memoIds = await fetchMemoIds(this.network, memos)
        filters.push({terms: {memo: [...memos, ...memoIds]}})
    }

    /**
     * Analyze id range conditions and add corresponding filter if needed
     * @param {{}[]} filters - Filters aggregator
     * @private
     */
    addIdRangeFilter(filters) {
        const {idConstraints} = this
        if (idConstraints.isEmpty)
            return
        if (idConstraints.isUnfeasible) {
            this.isUnfeasible = true
            return
        }
        filters.push({
            range: {
                id: idConstraints.resolve()
            }
        })
    }

    /**
     * Generate sharded index name based on year
     * @param {number} year
     * @return {string}
     */
    generateOpIndexName(year) {
        const {opIndex} = config.networks[this.network]
        return opIndex + year
    }

    /**
     * Prepare terms query
     * @return {Promise<[]|null>}
     */
    async buildQueryParams() {
        const filter = []
        //process filter builder pipeline
        const pipeline = [
            this.addCursorFilter,
            this.addTsFilter,
            this.addIdRangeFilter,
            this.addTypesFilter,
            this.addAccountFilter,
            this.addAssetFilter,
            this.addOfferFilter,
            this.addPoolFilter,
            this.addMemoFilter
        ]
        for (const step of pipeline) {
            const res = step.call(this, filter)
            if (res instanceof Promise) { //wait for async methods
                await res
            }
            //skip index lookup and return empty results set if the result is unfeasible
            if (this.isUnfeasible)
                return null
        }
        if (this.yearConstraints.isUnfeasible)
            return null
        return filter
    }

    /**
     * @param {{}} queryRequest
     * @param {'search'|'count'} method
     * @param {function} dataCallback
     * @return {Promise}
     * @private
     */
    async queryElastic(queryRequest, method, dataCallback) {
        let {size} = queryRequest
        let years = new Array(this.yearConstraints.to - this.yearConstraints.from + 1).fill(0)
        years = this.order === 'desc' ?
            years.map((v, i) => this.yearConstraints.to - i) :
            years.map((v, i) => this.yearConstraints.from + i)
        for (let year of years) {
            queryRequest.index = this.generateOpIndexName(year)
            if (size !== undefined) {
                queryRequest.size = size
            }
            const elasticResponse = await elastic[method](queryRequest)
            const shouldContinue = dataCallback(elasticResponse)
            if (!shouldContinue)
                break
        }
    }

    /**
     * Fetch data from Elastic index and archive DB
     * @return {Promise<TxQueryResponse[]>}
     * @private
     */
    async fetchTransactions() {
        const filter = await this.buildQueryParams()
        if (filter === null)
            return []
        //prepare and execute index query
        const queryRequest = {
            _source: false,
            size: this.limit,
            timeout: '5s',
            track_total_hits: this.limit,
            sort: [{id: {order: this.order}}],
            query: {bool: {filter}},
            fields: ['id']
        }
        const ids = await this.executeSearchQuery(queryRequest)
        if (!ids?.length)
            return []
        //fetch transactions from archive and corresponding ledgers
        const [transactions, ledgers] = await Promise.all([
            fetchArchiveTransactions(this.network, ids, normalizeOrder(this.order)),
            this.fetchLedgersInfo(ids)
        ])
        //prepare response, merge data from transactions and ledgers responses
        return transactions.map(tx => TxQuery.prepareResponseEntry(tx, ledgers[tx.id.high], true))
    }

    /**
     * @param {{}} queryRequest
     * @return {Promise<BigInt[]>}
     * @private
     */
    async executeSearchQuery(queryRequest) {
        let {size} = queryRequest
        let res = []
        await this.queryElastic(queryRequest, 'search', elasticResponse => {
            //retrieve transaction IDs from the response
            const ids = elasticResponse.hits.hits.map(h => BigInt(h._id))//& 0x7ffffffffffff000n)
            if (ids.length) {
                res = res.concat(ids)
                if (size !== undefined) {
                    size -= ids.length
                    if (size <= 0)
                        return false
                }
            }
            return true
        })
        return res
    }

    /**
     *
     * @return {Promise<number>}
     */
    async count() {
        if (this.isUnfeasible || this.idConstraints.isUnfeasible)
            return 0
        const filter = await this.buildQueryParams()
        if (filter === null)
            return 0
        //prepare and execute index query
        const queryRequest = {
            terminate_after: 10_000,
            //track_total_hits: this.limit,
            query: {bool: {filter}}
        }

        let res = 0
        await this.queryElastic(queryRequest, 'count', elasticResponse => {
            res += elasticResponse.count
            return true
        })
        return res
    }

    /**
     * Retrieve ledgers for a given set of transaction IDs
     * @param {BigInt[]} txIds - Transaction generic identifiers
     * @return {Promise<Object.<Number, {}>>}
     * @private
     */
    async fetchLedgersInfo(txIds) {
        const ledgerIds = new Set()
        for (const id of txIds) {
            ledgerIds.add(Number(id >> 32n))
        }
        const ledgers = await fetchLedgers(this.network, Array.from(ledgerIds))
        const res = {}
        for (const ledger of ledgers) {
            res[ledger._id] = ledger
        }
        return res
    }

    /**
     * @return {MultiRows}
     * @private
     */
    emptyResponse() {
        return preparePagedData(this.basePath, {
            sort: 'id',
            order: this.order,
            cursor: this.cursor,
            limit: this.limit,
            ...this.params
        }, [])
    }

    /**
     * @return {Promise<MultiRows>}
     */
    async toArray() {
        //do not query data if unfeasible conditions detected
        if (this.isUnfeasible || this.idConstraints.isUnfeasible)
            return this.emptyResponse()
        //fetch data
        const records = await this.fetchTransactions()

        return preparePagedData(this.basePath, {
            sort: 'id',
            order: this.order,
            cursor: this.cursor,
            limit: this.limit,
            ...this.params
        }, records)
    }

    /**
     * @param {{}} tx - Transaction data fetched from archive db
     * @param {{}} ledger - Ledger data fretched from analytics db
     * @param {Boolean} [addPagingToken] - Whether to add paging token for - the list response
     * @return {TxQueryResponse}
     * @private
     */
    static prepareResponseEntry(tx, ledger = {}, addPagingToken = false) {
        const id = tx.id.toString()
        const res = {
            id,
            hash: (tx.hash instanceof Array ? tx.hash[0] : tx.hash).toString('hex'),
            ledger: ledger._id,
            ts: ledger.ts,
            protocol: ledger.version,
            body: tx.body.toString('base64'),
            meta: tx.meta.toString('base64'),
            result: tx.result.toString('base64')
        }
        if (addPagingToken) {
            res.paging_token = id
        }
        return res
    }

    /**
     * Fetch a single transaction from history
     * @param {String} network
     * @param {String} txIdOrHash
     * @returns {Promise<TxQueryResponse>}
     */
    static async fetchTx(network, txIdOrHash) {
        if (typeof txIdOrHash !== 'string' || txIdOrHash.length > 64)
            throw errors.validationError('id', 'Invalid transaction id or hash')
        validateNetwork(network)
        //fetch the transaction
        const tx = await fetchSingleArchiveTransaction(network, txIdOrHash)
        if (!tx)
            throw errors.notFound(`Transaction ${txIdOrHash} not found on the ${network} ledger`)

        const ledger = await fetchLedger(network, tx.id.high)
        if (!ledger) // the ledger has not been processed by the ingestion pipeline yet
            throw errors.notFound(`Transaction ${txIdOrHash} has not been been processed yet`)
        return TxQuery.prepareResponseEntry(tx, ledger)
    }

    /**
     * Fetch a single transaction from history
     * @param {String} network
     * @param {Number} ledgerSequence
     * @returns {Promise<TxQueryResponse[]>}
     */
    static async fetchLedgerTransactions(network, ledgerSequence) {
        ledgerSequence = parseInt(ledgerSequence || '0', 10)
        if (typeof ledgerSequence !== 'number' || ledgerSequence <= 0 || ledgerSequence > 0XFFFFFFFF)
            throw errors.validationError('sequence', 'Invalid ledger sequence')
        validateNetwork(network)
        //fetch the transaction
        const res = await fetchArchiveLedgerTransactions(network, ledgerSequence)
        if (!res)
            throw errors.notFound(`Transaction ${ledgerSequence} not found on the ${network} ledger`)

        const ledger = await fetchLedger(network, ledgerSequence)
        return res.map(tx => TxQuery.prepareResponseEntry(tx, ledger))
    }


}

const typeMapping = {
    payments: [0, 1, 2, 8, 9, 13, 14, 15, 19, 20],
    trustlines: [6, 7, 21],
    dex: [3, 4, 12, 22, 23],
    settings: [0, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 21],
    soroban: [24, 25, 26],
    createAccount: 0,
    payment: 1,
    pathPaymentStrictReceive: 2,
    pathPaymentStrictSend: 13,
    createPassiveSellOffer: 4,
    manageSellOffer: 3,
    manageBuyOffer: 12,
    setOptions: 5,
    changeTrust: 6,
    allowTrust: 7,
    accountMerge: 8,
    inflation: 9,
    manageData: 10,
    bumpSequence: 11,
    createClaimableBalance: 14,
    claimClaimableBalance: 15,
    beginSponsoringFutureReserves: 16,
    endSponsoringFutureReserves: 17,
    revokeSponsorship: 18,
    clawback: 19,
    clawbackClaimableBalance: 20,
    setTrustLineFlags: 21,
    liquidityPoolDeposit: 22,
    liquidityPoolWithdraw: 23,
    invokeHostFunction: 24,
    bumpFootprintExpiration: 25,
    restoreFootprint: 26
}

function enforceArray(value) {
    if (!(value instanceof Array)) {
        return [value]
    }
    return value
}

module.exports = TxQuery

/**
 * @typedef {{}} TxQueryResponse
 * @property {String} id
 * @property {String} hash
 * @property {String} paging_token
 * @property {Number} ledger
 * @property {Number} ts
 * @property {String} body
 * @property {String} meta
 * @property {String} result
 */