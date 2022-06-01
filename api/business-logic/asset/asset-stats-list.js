const db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    {validateNetwork} = require('../validators'),
    errors = require('../errors')

async function queryAssetsOverallStats(network) {
    validateNetwork(network)
    const q = new QueryBuilder({
        supply: {$gt: 0},
        payments: {$gt: 0}
    })

    const res = await db[network].collection('assets').aggregate([
        {
            $match: q.query
        },
        {
            $group: {
                _id: null,
                total_assets: {'$sum': 1},
                payments: {$sum: '$payments'},
                trades: {$sum: '$trades'},
                volume: {$sum: '$volume'}
            }
        },
        {
            $project: {_id: 0}
        }
    ])
        .toArray()

    return res[0]
}

module.exports = {queryAssetsOverallStats}