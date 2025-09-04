const db = require('../../connectors/mongodb-connector')
const {resolveAssetId} = require('../asset/asset-resolver')
const {validateNetwork} = require('../validators')
const errors = require('../errors')

async function queryMarketStats(network, selling, buying, {ts}) {
    validateNetwork(network)
    const assetA = await resolveAssetId(network, selling)
    if (assetA === null)
        throw errors.validationError('selling', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format or contract address.')
    const assetB = await resolveAssetId(network, buying)
    if (assetB === null)
        throw errors.validationError('buying', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format or contract address.')
    const assets = [assetA, assetB]

    const [market] = await db[network].collection('markets')
        .find({$or: [{asset: assets}, {asset: assets.slice().reverse()}]})
        .toArray()

    if (!market) throw errors.notFound('Market statistics were not found on the ledger. Check if you specified the assets correctly.')

    const reverse = market.asset.join() === assets.join()
    const res = {
        asset: [selling, buying],
        created: market.created,
        trades: market.trades,
        trades24h: market.trades24h,
        base_volume24h: reverse ? market.counterVolume24h : market.baseVolume24h,
        base_volume7d: reverse ? market.counterVolume7d : market.baseVolume7d,
        counter_volume24h: reverse ? market.baseVolume24h : market.counterVolume24h,
        counter_volume7d: reverse ? market.baseVolume7d : market.counterVolume7d
    }
    if (market.spread !== undefined) {
        res.spread = parseFloat(market.spread.toPrecision(3))
    }
    if (market.slippage !== undefined) {
        res.slippage = parseFloat(market.slippage.toPrecision(3))
    }
    return res
}

module.exports = {queryMarketStats}