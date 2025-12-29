const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')

async function queryAssetsOverallStats(network) {
    validateNetwork(network)

    const [res] = await db[network].collection('assets').aggregate([
        {
            $match: {'rating.average': {$exists: true}}
        },
        {
            $group: {
                _id: null,
                total_assets: {'$sum': 1},
                trades: {$sum: '$trades24h'},
                volume: {$sum: '$volume24h'}
            }
        },
        {
            $project: {_id: 0}
        }
    ])
        .toArray()

    res.volume = Math.round(res.volume || 0)
    return res
}

module.exports = {queryAssetsOverallStats}