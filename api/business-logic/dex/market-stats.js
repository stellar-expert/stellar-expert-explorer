const db = require('../../connectors/mongodb-connector')
const {validateNetwork, validateAssetName} = require('../validators')
const errors = require('../errors')

async function queryMarketStats(network, selling, buying, {ts}) {
    validateNetwork(network)

    const assets = [validateAssetName(selling), validateAssetName(buying)]

    const [market] = await db[network].collection('markets')
        .find({$or: [{asset: assets}, {asset: assets.slice().reverse()}]})
        .toArray()

    if (!market)
        throw errors.notFound('Market statistics were not found on the ledger. Check if you specified the assets correctly.')

    const reverse = market.asset.join() === assets.join()
    const res = {
        asset: [selling, buying],
        trades24h: market.trades24h,
        base_volume24h: reverse ? market.quoteVolume24h : market.baseVolume24h,
        base_volume7d: reverse ? market.quoteVolume7d : market.baseVolume7d,
        counter_volume24h: reverse ? market.baseVolume24h : market.quoteVolume24h,
        counter_volume7d: reverse ? market.baseVolume7d : market.quoteVolume7d
    }
    return res
}

module.exports = {queryMarketStats}