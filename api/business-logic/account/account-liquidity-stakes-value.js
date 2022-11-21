const db = require('../../connectors/mongodb-connector')

async function estimateLiquidityStakesValue(network, accountId) {
    return await db[network].collection('liquidity_pool_stakes').aggregate([
        {
            $match: {
                account: accountId,
                stake: {$gt: 0}
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
                value: {$floor: {$divide: [{$multiply: ['$stake', '$pool.tvl']}, '$pool.shares']}}
            }
        }
    ]).toArray()
}

module.exports = {estimateLiquidityStakesValue}