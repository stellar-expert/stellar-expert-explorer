const {Long, Int32} = require('bson')
const db = require('../../connectors/mongodb-connector')

async function estimateLiquidityStakesValue(network, accountId) {
    return await db[network].collection('trustlines').aggregate([
        {
            $match: {
                _id: {$gt: new Long(0, accountId), $lt: new Long(0, accountId + 1)},
                asset: {$lt: 0}
            }
        },
        {
            $project: {
                pool: {$multiply: ['$asset', new Int32(-1)]},
                stake: '$balance'
            }
        },
        {
            $lookup: {
                from: 'liquidity_pools',
                localField: 'pool',
                foreignField: '_id',
                as: 'poolInfo'
            }
        },
        {
            $project: {
                _id: 0,
                stake: 1,
                pool: {$first: '$poolInfo'}
            }
        },
        {
            $project: {
                pool: '$pool.hash',
                stake: 1,
                value: {
                    $cond: [
                        {$and: [{$gt: ['$stake', 0]}, {$gt: ['$pool.tvl', 0]}]},
                        {$floor: {$divide: [{$multiply: ['$stake', '$pool.tvl']}, '$pool.shares']}},
                        Long.ZERO]
                }
            }
        },
        {
            $sort: {
                value: -1,
                pool: 1
            }
        }
    ]).toArray()
}

module.exports = {estimateLiquidityStakesValue}