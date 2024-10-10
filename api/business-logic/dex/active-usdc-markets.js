const {unixNow} = require('../../utils/date-utils')
const db = require('../../connectors/mongodb-connector')
const {resolveAssetId, AssetJSONResolver} = require('../asset/asset-resolver')

function getTradesTimestamp() {
    return BigInt(unixNow() - 24 * 60 * 60) << 32n
}

let baseAssetId

async function resolveBaseAssetId() {
    if (!baseAssetId) {
        baseAssetId = await resolveAssetId('public', 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-1')
    }
    return baseAssetId
}

async function fetchActiveUsdcMarkets() {
    const base = await resolveBaseAssetId()
    const volumes = await db.public.collection('trades').aggregate([
        {
            $match: {asset: base, _id: {$gte: getTradesTimestamp()}}
        },
        {
            $project: {
                quote: {
                    $arrayElemAt: ['$asset', {$cond: [{$eq: [{$arrayElemAt: ['$asset', 0]}, base]}, 1, 0]}]
                },
                volume: {
                    $arrayElemAt: ['$amount', {$cond: [{$eq: [{$arrayElemAt: ['$asset', 0]}, base]}, 0, 1]}]
                }
            }
        },
        {
            $group: {
                _id: '$quote',
                volume: {$sum: '$volume'}
            }
        },
        {
            $match: {
                volume: {$gt: 1000_0000000n} // >1000$
            }
        }
    ]).toArray()
    const assetResolver = new AssetJSONResolver('public')
    const res = volumes.map(v => assetResolver.resolve(v._id))
    await assetResolver.fetchAll()
    return res
}

module.exports = {fetchActiveUsdcMarkets}