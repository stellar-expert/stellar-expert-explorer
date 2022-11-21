const db = require('../../connectors/mongodb-connector')

async function estimateTrustlinesValue(network, accountId) {
    return await db[network].collection('trustlines').aggregate([
        {
            $match: {
                account: accountId,
                balance: {$gt: 0}
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
                asset: {$first: '$assetInfo'}
            }
        },
        {
            $project: {
                asset: '$asset.name',
                balance: 1,
                value: {$floor: {$multiply: ['$balance', {$ifNull: ['$asset.lastPrice', 0]}]}}
            }
        }
    ]).toArray()
}

module.exports = {estimateTrustlinesValue}