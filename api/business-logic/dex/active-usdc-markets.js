const db = require('../../connectors/mongodb-connector')

const USDC = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-1'

async function fetchActiveUsdcMarkets() {
    const volumes = await db.public.collection('markets').aggregate([
        {$match: {asset: USDC}},
        {
            $project: {
                quote: {$arrayElemAt: ['$asset', {$cond: [{$eq: [{$arrayElemAt: ['$asset', 0]}, USDC]}, 1, 0]}]},
                volume: {$cond: [{$eq: [{$arrayElemAt: ['$asset', 0]}, USDC]}, '$baseVolume24h', '$quoteVolume24h']}
            }
        },
        {$match: {volume: {$gt: 1000_0000000n}}},// >1000$
        {$sort: {volume: -1}}
    ]).toArray()
    return volumes.map(v => v.quote)
}

module.exports = {fetchActiveUsdcMarkets}