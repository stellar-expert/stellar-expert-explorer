const {Long} = require('mongodb')
const db = require('../../connectors/mongodb-connector')

/**
 * @param {String} network - Stellar network id
 * @param {Number} parentId - Account or contract id
 * @return {Promise<{}[]>}
 */
async function queryBalances(network, parentId) {
    //fetch trustlines
    const trustlines = await db[network].collection('trustlines')
        .find({
            _id: {
                $gte: new Long(0, parentId),
                $lt: new Long(0, parentId + 1)
            }
        })
        .limit(1000)
        .project({_id: 0, account: 0, updated: 0})
        .toArray()
    //put XLM trustline first
    const xlmTrustlinePosition = trustlines.findIndex(t => t.asset === 0)
    if (xlmTrustlinePosition > 0) {
        const xlmTrustline = trustlines[xlmTrustlinePosition]
        trustlines.splice(xlmTrustlinePosition, 1)
        trustlines.unshift(xlmTrustline)
    }

    //retrieve asset ids for all non-zero trustlines
    const balanceAssets = trustlines.map(t => t.asset)
    //fetch corresponding prices
    const fetchedAssets = await db[network].collection('assets')
        .find({
            _id: {$in: balanceAssets}
        })
        .project({_id: 1, lastPrice: 1, name: 1})
        .toArray()
    //map retrieved assets for fast access
    const assetMap = new Map()
    for (const asset of fetchedAssets) {
        assetMap.set(asset._id, {price: asset.lastPrice || 0, name: asset.name})
    }
    //process records
    return trustlines.map(t => {
        const asset = assetMap.get(t.asset)
        const res = {
            asset: asset.name,
            balance: t.balance,
            flags: t.flags,
            created: t.created
        }
        if (asset.price > 0) {
            res.value = Math.floor(t.balance.toNumber() * asset.price).toString()
        }
        return res
    })
}


module.exports = {queryBalances}