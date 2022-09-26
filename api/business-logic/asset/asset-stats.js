const db = require('../../connectors/mongodb-connector'),
    {validateNetwork, validateAssetName} = require('../validators'),
    AssetDescriptor = require('./asset-descriptor'),
    errors = require('../errors')
const {fetchAssetsSupply} = require('./asset-supply')

async function queryAssetStats(network, asset, {ts}) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({name: new AssetDescriptor(asset).toFQAN()})

    if (!assetInfo) throw errors.notFound('Asset statistics were not found on the ledger. Check if you specified the asset correctly.')

    const res = {
        asset: assetInfo.name,
        created: assetInfo.created,
        supply: assetInfo.supply,
        trustlines: assetInfo.trustlines,
        payments: assetInfo.payments,
        payments_amount: assetInfo.paymentsAmount,
        trades: assetInfo.totalTrades,
        traded_amount: assetInfo.baseVolume,
        price: assetInfo.lastPrice,
        volume: assetInfo.quoteVolume,
        volume7d: assetInfo.volume7d,
        price7d: assetInfo.price7d
    }

    if (res.trustlines.authorized < 0) {
        res.trustlines.authorized = 0
    }
    if (assetInfo.tomlInfo) {
        res.toml_info = assetInfo.tomlInfo
        res.home_domain = assetInfo.domain
    }

    if (assetInfo._id > 0) {
        Object.assign(res, {
            rating: assetInfo.rating,
        })
        const s = await fetchAssetsSupply([assetInfo._id], network)
        res.supply = s[assetInfo._id]
    }
    if (assetInfo._id === 0) {
        //fetch fee pool and reserve for XLM
        const [xlmHistory, poolHistory] = await Promise.all([
            db[network].collection('asset_history')
                .find({asset: assetInfo._id})
                .sort({_id: -1})
                .limit(2)
                .project({reserve: 1})
                .toArray(),
            db[network].collection('network_stats')
                .find({})
                .sort({_id: -1})
                .project({fee_pool: 1})
                .limit(1)
                .toArray()
        ])
        res.fee_pool = poolHistory[0].fee_pool
        if (xlmHistory[0] && xlmHistory[0].reserve) {
            res.reserve = xlmHistory[0].reserve
        } else {
            if (xlmHistory.length > 1) {
                const {reserve} = xlmHistory[1]
                res.reserve = reserve || '0'
            } else {
                res.reserve = '0'
            }
        }
    }

    return res
}

module.exports = {queryAssetStats}