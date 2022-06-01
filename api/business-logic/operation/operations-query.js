const {Long} = require('bson'),
    BigNumber = require('bignumber.js'),
    db = require('../../connectors/mongodb-connector'),
    TimestampConstraints = require('../../utils/timestamp-constraints'),
    QueryBuilder = require('../query-builder'),
    Asset = require('../asset/asset-descriptor'),
    {iterateOperationShards} = require('../sharding/shard-resolver'),
    {extractSequenceFromGenericId, parseGenericId} = require('../../utils/generic-id-utils'),
    {validateNetwork, validateOfferId, validatePoolId} = require('../validators'),
    {normalizeOrder, preparePagedData, normalizeLimit} = require('../api-helpers'),
    {resolveTimestampFromSequence} = require('../ledger/ledger-timestamp-resolver'),
    {encodeOperationMuxedAccount} = require('../../utils/muxed-account-encoder'),
    {adjustAmount} = require('../../utils/formatter'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {AccountAddressJSONResolver} = require('../account/account-resolver'),
    {LiquidityPoolJSONResolver} = require('../liquidity-pool/liquidity-pool-resolver'),
    {MemoJSONResolver, fetchMemoIds} = require('../memo/memo-resolver'),
    errors = require('../errors')

class OperationsQuery {
    constructor(network, basePath, {order, cursor, limit, ...extraParams}) {
        validateNetwork(network)
        this.network = network
        this.basePath = basePath
        this.cursor = cursor
        this.order = normalizeOrder(order, -1)
        this.constraints = new TimestampConstraints()
        this.query = new QueryBuilder()
            .setLimit(limit)
            .setSort('_id', order)
        this.extraQueryParams = extraParams
    }

    basePath

    network

    /**
     * @type {TimestampConstraints}
     */
    constraints

    /**
     * @type {QueryBuilder}
     */
    query

    order

    cursor

    extraQueryParams

    isUnfeasible = false

    async applyCursor() {
        if (!this.cursor) return this
        try {
            const parsedCursor = Long.fromString(this.cursor),
                cursorTimestamp = await resolveTimestampFromSequence(this.network, extractSequenceFromGenericId(parsedCursor))
            if (this.order === 1) {
                this.query.addQueryFilter({_id: {$gt: parsedCursor}})
                this.constraints.addBottomConstraint(cursorTimestamp + 1)
            } else {
                this.query.addQueryFilter({_id: {$lt: parsedCursor}})
                this.constraints.addTopConstraint(cursorTimestamp - 1)
            }
        } catch (e) {
            throw errors.validationError('cursor', `Invalid paging cursor: "${this.cursor}".`)
        }
    }

    addTypesFilter(types) {
        if (!types) return this
        return this.addQueryFilter({type: {$in: types}})
    }

    addQueryFilter(condition) {
        this.query.addQueryFilter(condition)
        return this
    }

    /**
     * @param {Array<String>|String} assets
     * @param {'any'|'source'|'dest'} position
     * @return {Promise<boolean>}
     */
    async addAssetFilter(assets, position = 'any') {
        assets = enforceArray(assets)
        if (assets.length > 20)
            throw errors.validationError('asset', `Too many asset conditions.`)
        assets = assets.map(a => new Asset(a).toFQAN())
        const matchedAssets = await db[this.network].collection('assets')
            .find({name: {$in: assets}}, {projection: {created: 1, updated: 1}}).toArray()

        const assetsFilter = []
        for (let matchedAsset of matchedAssets) {
            assetsFilter.push(matchedAsset._id)
        }
        if (assetsFilter.length) {
            this.constraints.addBottomConstraint(Math.min.apply(null, matchedAssets.map(ma => ma.created)))
            //this.constraints.addTopConstraint(matchedAsset.updated)
        }
        this.addQueryFilter({[addPositionalArgument('asset', position)]: {$in: assetsFilter}})
        if (!assetsFilter.length) {
            this.isUnfeasible = true
            return false
        }
        return true
    }

    /**
     * @param {Array<String>|String} addresses
     * @param {'any'|'source'|'dest'} position
     * @return {Promise<Boolean>}
     */
    async addAccountFilter(addresses, position = 'any') {
        addresses = enforceArray(addresses)
        if (addresses.length > 20)
            throw errors.validationError('account', `Too many account conditions.`)

        const matchedAccounts = await db[this.network].collection('accounts')
            .find({address: {$in: addresses}}, {projection: {created: 1, updated: 1}}).toArray()

        const accountsFilter = []
        for (let matchedAccount of matchedAccounts) {
            accountsFilter.push(matchedAccount._id)
        }
        if (accountsFilter.length) {
            this.constraints.addBottomConstraint(Math.min.apply(null, matchedAccounts.map(ma => ma.created)))
            this.constraints.addTopConstraint(Math.max.apply(null, matchedAccounts.map(ma => ma.updated)))
        }
        this.addQueryFilter({[addPositionalArgument('account', position)]: {$in: accountsFilter}})
        if (!accountsFilter.length) {
            this.isUnfeasible = true
            return false
        }
        return true
    }

    /**
     * @param {Array<Long>|Long} offers
     * @return {Promise<Boolean>}
     */
    async addOfferFilter(offers) {
        offers = enforceArray(offers)
        if (offers.length > 20)
            throw errors.validationError('offer', `Too many offer conditions.`)

        offers = offers.map(validateOfferId)

        const matchedOffers = await db[this.network].collection('offers')
            .find({_id: {$in: offers}}, {projection: {created: 1, updated: 1}}).toArray()

        const offersFilter = []
        for (let offer of matchedOffers) {
            offersFilter.push(offer._id)
            this.constraints.addBottomConstraint(offer.created)
            this.constraints.addTopConstraint(offer.updated)
        }
        this.addQueryFilter({'offerId': {$in: offersFilter}})
        if (!offersFilter.length) {
            this.isUnfeasible = true
            return false
        }
        return true
    }

    /**
     * @param {Array<Long>|Long} pools
     * @return {Promise<Boolean>}
     */
    async addPoolFilter(pools) {
        pools = enforceArray(pools)
        if (pools.length > 20)
            throw errors.validationError('pool', `Too many pool conditions.`)

        pools = pools.map(validatePoolId)

        const matchedPools = await db[this.network].collection('liquidity_pools')
            .find({hash: {$in: pools}}, {projection: {created: 1, updated: 1}}).toArray()

        const poolFilters = []
        for (let pool of matchedPools) {
            poolFilters.push(pool._id)
            this.constraints.addBottomConstraint(pool.created)
            this.constraints.addTopConstraint(pool.updated)
        }
        this.addQueryFilter({'pool': {$in: poolFilters}})
        if (!poolFilters.length) {
            this.isUnfeasible = true
            return false
        }
        return true
    }

    /**
     * @param {Array<String>|String} memos
     * @return {Promise<Boolean>}
     */
    async addMemoFilter(memos) {
        memos = enforceArray(memos)
        if (memos.length > 20)
            throw errors.validationError('memo', `Too many memo conditions.`)

        const memoIds = await fetchMemoIds(this.network, memos)

        this.addQueryFilter({memo: {$in: memoIds}})
        if (!memoIds.length) {
            this.isUnfeasible = true
            return false
        }
        return true
    }

    /**
     * @param {String} amount
     * @return {Promise<Boolean>}
     */
    async addAmountFilter(amount) {
        const amt = new BigNumber(amount).times(10000000)
        if (amt.isNegative() || amt.isZero()) {
            this.isUnfeasible = true
            return false
        }
        this.addQueryFilter({amount: Long.fromString(amt.toString().split('.')[0]).toString()})
        return true
    }

    async fetchData() {
        let {query, sort, limit} = this.query
        limit = normalizeLimit(limit)
        let res = []
        const shardIterator = await iterateOperationShards(this.network, this.constraints.from, this.constraints.to, this.order)
        for (let shard of shardIterator) {
            const data = await db[this.network].collection(shard)
                .find(query, {sort, limit: limit - res.length})
                .toArray()
            if (data.length) {
                res = res.concat(data)
                if (res.length === limit) break
            }
        }
        return res
    }

    async processResults(records) {
        const assetResolver = new AssetJSONResolver(this.network),
            accountResolver = new AccountAddressJSONResolver(this.network),
            poolResolver = new LiquidityPoolJSONResolver(this.network),
            memoResolver = new MemoJSONResolver(this.network)

        const rows = records.map(row => {
            const plainId = row._id.toString(),
                op = {
                    id: plainId,
                    paging_token: plainId,
                    type: row.type,
                    ts: row.ts
                }
            if (row.muxed) {
                op.accounts = row.account.map((a, i) => accountResolver.resolve(a, null, baseAccount => encodeOperationMuxedAccount(baseAccount, row.muxed[i])))
            } else {
                op.accounts = row.account.map(a => accountResolver.resolve(a))
            }
            const {ledger, tx} = parseGenericId(row._id)
            Object.assign(op, {ledger, tx})
            if (row.asset) {
                op.assets = row.asset.map(a => a < 0 ? poolResolver.resolve(-a) : assetResolver.resolve(a))
            }
            if (row.amount) {
                if (op.type === 7) {
                    op.authorized = row.amount > 0
                } else {
                    op.amount = adjustAmount(row.amount)
                }
            }
            if (row.sourceAmount) {
                op.source_amount = adjustAmount(row.sourceAmount)
            }
            if (row.sourceMax) {
                op.source_max = adjustAmount(row.sourceMax)
            }
            if (row.destMin) {
                op.dest_min = adjustAmount(row.destMin)
            }
            if (row.offerId) {
                if (row.created) {
                    op.createdOffer = row.offerId.toString()
                } else {
                    op.offer = row.offerId.toString()
                }
            }
            if (row.price) {
                op.price = row.price
            }
            if (row.memo) {
                op.memo = memoResolver.resolveMemoValue(row.memo)
                op.memo_type = memoResolver.resolveMemoType(row.memo)
            }
            if (row.revoke) {
                op.revoke = row.revoke
                op.revoke.account = accountResolver.resolve(op.revoke.account)
                if (op.revoke.asset) {
                    op.revoke.asset = assetResolver.resolve(op.revoke.asset)
                }
            }
            if (row.balanceId) {
                op.balanceId = row.balanceId
            }
            if (row.claimants) {
                op.claimants = row.claimants.map(c => ({...c, destination: accountResolver.resolve(c.destination)}))
            }
            if (row.pool) {
                op.pool = poolResolver.resolve(row.pool)
            }
            if (row.maxAmount) {
                op.max_amount = row.maxAmount.map(a => adjustAmount(a))
            }
            if (row.minAmount) {
                op.min_amount = row.minAmount.map(a => adjustAmount(a))
            }
            return op
        })

        await Promise.all([
            assetResolver.fetchAll(),
            accountResolver.fetchAll(),
            memoResolver.fetchAll(),
            poolResolver.fetchAll()
        ])

        return rows
    }

    /**
     * @return {Promise<MultiRows>}
     */
    async toArray() {
        //do not query data if unfeasible conditions detected
        if (this.isUnfeasible || this.constraints.isUnfeasible) return this.emptyResponse()
        await this.applyCursor()
        this.query.setTimestampConstraints(this.constraints)
        //fetch data
        const records = await this.fetchData()

        return preparePagedData(this.basePath, {
            sort: 'id',
            order: this.order,
            cursor: this.cursor,
            limit: this.query.limit,
            ...this.extraQueryParams
        }, await this.processResults(records))
    }

    emptyResponse() {
        return preparePagedData(this.basePath, {
            sort: 'id',
            order: this.order,
            cursor: this.cursor,
            limit: this.query.limit,
            ...this.extraQueryParams
        }, [])
    }
}

function enforceArray(value) {
    if (!(value instanceof Array)) {
        return [value]
    }
    return value
}

function addPositionalArgument(field, position) {
    let res = field
    switch (position) {
        case 'source':
            res += '.0'
            break
        case 'dest':
            res += '.1'
            break
    }
    return res
}

module.exports = OperationsQuery