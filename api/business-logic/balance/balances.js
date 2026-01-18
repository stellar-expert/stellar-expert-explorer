const db = require('../../connectors/mongodb-connector')
const {estimateAssetPrices} = require('../asset/asset-price')
const {
    validateTimestamp,
    validateNetwork,
    validateAccountAddress,
    validateAccountOrContractAddress
} = require('../validators')

/**
 * @param {String} network - Stellar network id
 * @param {String} address - Account or contract address
 * @param {Number} [ts] - Point in time to fetch balances at
 * @return {Promise<{}[]>}
 */
async function queryBalances(network, address, ts) {
    ts = validateTimestamp(ts)
    let balances
    if (ts) {
        //fetch balances at a given point in time
        balances = await db[network].collection('balances')
            .find({address}, {projection: {asset: 1, history: 1, flags: 1, updated: 1, deleted: 1, _id: 0}})
            .limit(1000)
            .toArray()

        balances = balances
            .map(b => {
                let balance = 0n
                for (const [ts, record] of Object.entries(b.history)) {
                    if (parseInt(ts, 10) > ts)
                        break
                    balance = record[1]
                }
                return {asset: b.asset, balance, flags: b.flags, updated: b.updated, deleted: b.deleted}
            })
    } else {
        //fetch current balances
        balances = await db[network].collection('balances')
            .find({address}, {projection: {asset: 1, balance: 1, flags: 1, updated: 1, deleted: 1, _id: 0}})
            .limit(1000)
            .toArray()
    }
    //retrieve asset ids for all non-zero balances
    const balanceAssets = balances.filter(b => b.balance > 0).map(t => t.asset)
    //fetch prices
    const assetPrices = await estimateAssetPrices(network, balanceAssets, ts)
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

module.exports = {queryBalances, estimateAddressValue}