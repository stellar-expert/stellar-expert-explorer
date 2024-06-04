const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')

async function estimateTrustlinesValue(network, accountId) {
    return await db[network].collection('trustlines').aggregate([
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
        }
    ]).toArray()
}

module.exports = {estimateTrustlinesValue}