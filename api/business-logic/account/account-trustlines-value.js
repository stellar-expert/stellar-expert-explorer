const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')

async function estimateTrustlinesValue(network, accountId) {
    const trustlines = await db[network].collection('trustlines').aggregate([
        {
            $match: {
                _id: {$gte: new Long(0, accountId), $lt: new Long(0, accountId + 1)},
                asset: {$gte: 0}
            }
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'asset',
                foreignField: '_id',
                as: 'assetInfo'
            }
        },
        {
            $project: {
                _id: 0,
                balance: 1,
                asset: {$first: '$assetInfo'},
                flags: 1
            }
        },
        {
            $project: {
                asset: '$asset.name',
                balance: 1,
                value: {$floor: {$multiply: ['$balance', {$ifNull: ['$asset.lastPrice', 0]}]}},
                flags: 1
            }
        },
        {
            $sort: {
                value: -1,
                asset: 1
            }
        }
    ]).toArray()

    const xlmIdx = trustlines.findIndex(t => t.asset === 'XLM')
    if (xlmIdx < 0) { //no XLM trustline found
        trustlines.unshift({
            asset: 'XLM',
            balance: Long.ZERO,
            value: 0,
            flags: 0
        })
    } else if (xlmIdx > 0) {
        const [xlmTrustline] = trustlines.splice(xlmIdx, 1)
        trustlines.unshift(xlmTrustline)
    }

    return trustlines
}

module.exports = {estimateTrustlinesValue}