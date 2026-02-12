const {Decimal128} = require('mongodb')
const db = require('../../connectors/mongodb-connector')
const {estimateAssetPrices} = require('../asset/asset-price')
const {
    validateTimestamp,
    validateNetwork,
    validateAccountOrContractAddress,
    isValidContractAddress,
} = require('../validators')
const {decimalToBigint} = require('../../utils/decimal')

/**
 * @param {String} network - Stellar network id
 * @param {String} address - Account or contract address
 * @param {Number} [ts] - Point in time to fetch balances at
 * @return {Promise<{}[]>}
 */
async function queryBalances(network, address, ts) {
    const pointInTime = validateTimestamp(ts)
    let balances
    if (pointInTime) {
        //fetch balances at a given point in time
        balances = await fetchBalances(network, {address}, {
            projection: {
                asset: 1,
                history: 1,
                flags: 1,
                updated: 1,
                deleted: 1,
                _id: 0
            }
        })

        balances = balances
            .map(b => {
                let balance = 0n
                for (const [ts, record] of Object.entries(b.history)) {
                    if (parseInt(ts, 10) > pointInTime)
                        break
                    balance = BigInt(record[1])
                }
                return {asset: b.asset, balance, flags: b.flags, updated: b.updated, deleted: b.deleted}
            })
    } else {
        //fetch current balances
        balances = await fetchBalances(network, {address}, {
            projection: {
                asset: 1,
                balance: 1,
                flags: 1,
                updated: 1,
                deleted: 1,
                _id: 0
            }
        })
    }
    //retrieve asset ids for all non-zero balances
    const balanceAssets = balances.filter(b => b.balance > 0).map(t => t.asset)
    //fetch prices
    const assetPrices = await estimateAssetPrices(network, balanceAssets, pointInTime)
    //prepare result
    const res = balances.map(b => {
        const res = {
            asset: b.asset,
            balance: b.balance,
            flags: b.flags || 1,
            updated: b.updated
        }
        if (b.deleted) {
            res.deleted = true
        }
        const price = assetPrices.get(b.asset)
        if (price) {
            res.value = Math.floor(price * Number(b.balance))
        }
        return res
    })
    //sort by value descending, then by asset name ascending
    res.sort((a, b) => {
        const vd = (b.value ?? 0) - (a.value ?? 0)
        if (vd !== 0)
            return vd
        if (a.deleted != b.deleted)
            return b.deleted ? -1 : 1
        if (a.balance !== b.balance)
            return Number(b.balance - a.balance)
        return a.asset > b.asset ? 1 : -1
    })
    //ensure XLM is always first in the list
    const xlmIdx = res.findIndex(t => t.asset === 'XLM')
    if (xlmIdx < 0) { //no XLM trustline found
        if (!address.startsWith('C')) {
            res.unshift({
                asset: 'XLM',
                balance: 0n,
                value: 0,
                flags: 1
            })
        }
    } else if (xlmIdx > 0) {
        const [xlmTrustline] = res.splice(xlmIdx, 1)
        res.unshift(xlmTrustline)
    }

    return res
}

async function estimateAddressValue(network, address, currency = 'USD', ts = undefined) {
    validateNetwork(network)
    validateAccountOrContractAddress(address)

    const balances = await queryBalances(network, address, ts)

    return {
        address,
        balances,
        total: balances.reduce((prev, current) => {
            if (current.value > 0) {
                return prev + current.value
            }
            return prev
        }, 0),
        currency
    }
}

/**
 * Convert balance query value to match the asset format
 * @param {string} asset
 * @param {bigint} balance
 * @return {bigint|Decimal128}
 */
function normalizeBalanceValue(asset, balance) {
    if (isValidContractAddress(asset)) {
        if (balance instanceof Decimal128)
            return balance
        return Decimal128.fromStringWithRounding(typeof balance === 'string' ? balance : balance.toString())
    }
    return balance
}

/**
 *
 * @param {string} network
 * @param {{}} filter
 * @param {number} [limit=1000]
 * @param {{}} [projection]
 * @param {{}} [sort]
 * @param {{}} [hint]
 * @return {Promise<*>}
 */
async function fetchBalances(network, filter, {limit = 1000, projection = {}, sort, hint}) {
    if (projection._id === undefined) {
        projection._id = 0
    }

    const params = {projection, limit}
    if (sort) {
        params.sort = sort
    }
    if (hint) {
        params.hint = hint
    }
    const res = await db[network]
        .collection('balances')
        .find(filter, params)
        .toArray()

    for (let record of res) {
        if (record.balance instanceof Decimal128) {
            record.balance = decimalToBigint(record.balance)
        }
    }
    return res
}

/**
 * Fetch number of balances greater than a given value
 * @param {string} network
 * @param {string} asset
 * @param {bigint} value
 * @return {Promise<number>}
 */
async function countBalancesGt(network, asset, value) {
    return await db[network].collection('balances')
        .countDocuments({asset, balance: {$gt: normalizeBalanceValue(asset, value)}})
}

module.exports = {queryBalances, estimateAddressValue, normalizeBalanceValue, fetchBalances, countBalancesGt}