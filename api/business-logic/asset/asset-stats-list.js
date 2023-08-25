const db = require('../../connectors/mongodb-connector')
const QueryBuilder = require('../query-builder')
const {validateNetwork} = require('../validators')

async function queryAssetsOverallStats(network) {
    validateNetwork(network)
    const q = new QueryBuilder({
        supply: {$ne: 0},
        payments: {$gt: 0}
    })

    const [res] = await db[network].collection('assets').aggregate([
        {
            $match: q.query
        },
        {
            $group: {
                _id: null,
                total_assets: {'$sum': 1},
                payments: {$sum: '$payments'},
                trades: {$sum: '$trades'},
                volume: {$sum: '$quoteVolume'}
            }
        },
        {
            $project: {_id: 0}
        }
    ])
        .toArray()

    res.volume = Math.round(res.volume)
    return res
}

module.exports = {queryAssetsOverallStats}