const db = require('../../connectors/mongodb-connector')
const {validateNetwork, isValidPoolId, validatePoolId, validateAssetName} = require('../validators')
const {preparePagedData} = require('../api-helpers')
const errors = require('../errors')
const {locateOhlcPrice} = require('../dex/ohlcvt-aggregator')

async function queryAssetPrices(network, basePath, {asset}, limit = 200) {
    validateNetwork(network)

    if (!asset?.length || !(asset instanceof Array))
        throw errors.validationError('asset', 'Array of asset identifiers expected.')
    if (asset.length > limit)
        throw errors.validationError('asset', 'Too many assets.')

    asset = asset.map(a => {
        if (isValidPoolId(a))
            return validatePoolId(a)
        return validateAssetName(a)
    })
    const prices = await estimateAssetPrices(network, asset)

    return preparePagedData(basePath, {
        asset: prices.keys(),
        sort: 'asset',
        order: 'asc',
        allowedLinks: {
            self: 1
        }
    }, Array.from(prices.entries().map(([asset, price]) => ({asset, price}))))
}

/**
 * Estimate asset prices based on OHLCV data from the DEX
 * @param {String} network
 * @param {String[]} assets
 * @param {Number} [ts]
 * @return {Promise<Map<String,Number>>}
 */
async function estimateAssetPrices(network, assets, ts = undefined) {
    if (!assets.length)
        return new Map()
    const requestedAssets = new Set()
    const requestedPools = new Set()
    for (const a of assets) {
        try {
            if (a.length === 56 && a[0] === 'L') {
                requestedPools.add(a)
                continue
            }
            requestedAssets.add(a)
        } catch (e) {
            throw errors.validationError('asset', `Invalid asset descriptor: "${a}". Expected format: {code}-{issuer}.`)
        }
    }
    //process classic assets
    const prices = requestedAssets.size?
        await locateOhlcPrice(network, 'asset_ohlcvt', {$in: Array.from(requestedAssets)}, ts):
        new Map()
    //process liquidity pools
    if (requestedPools.size) {
        const foundPools = await db[network].collection('liquidity_pools')
            .find({_id: {$in: Array.from(requestedPools)}})
            .project({asset: 1, shares: 1, reserves: 1})
            .toArray()

        if (foundPools.length) {
            const assetsToPopulate = new Set()
            for (const {asset} of foundPools) {
                for (let i = 0; i <= 1; i++) {
                    const a = asset[i]
                    if (!prices.has(a)) {
                        assetsToPopulate.add(a)
                    }
                }
            }
            const poolAssets = new Map()
            if (assetsToPopulate.size) {
                const populated = await estimateAssetPrices(network, Array.from(assetsToPopulate), ts)
                for (const p of populated) {
                    poolAssets.set(p.asset, p.price)
                }
            }
            for (const p of foundPools) {
                if (!(p.shares > 0))
                    continue
                let tvl = 0
                for (let i = 0; i <= 1; i++) {
                    const a = p.asset[i]
                    const assetPrice = prices.get(a)||poolAssets.get(a)
                    if (!assetPrice) {
                        tvl = 0
                        break
                    }
                    tvl += assetPrice * Number(p.reserves[i])
                }
                const price = tvl / Number(p.shares)
                if (price > 0) {
                    prices.set(p._id, price)
                }
            }
        }
    }
    return prices
}

module.exports = {queryAssetPrices, estimateAssetPrices}