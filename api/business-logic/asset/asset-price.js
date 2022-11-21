const db = require('../../connectors/mongodb-connector')
const AssetDescriptor = require('./asset-descriptor')
const {validateNetwork} = require('../validators')
const {preparePagedData} = require('../api-helpers')
const errors = require('../errors')

async function queryAssetPrices(network, basePath, {asset}) {
    validateNetwork(network)

    if (!asset?.length || !(asset instanceof Array))
        throw errors.validationError('asset', 'Array of asset identifiers expected.')
    if (asset.length > 200)
        throw errors.validationError('asset', 'Too many assets.')

    const parsedAssets = {}
    const parsedPools = {}
    for (const a of asset) {
        try {
            if (/^[a-f0-9]{64}$/.test(a)) {
                parsedPools[a] = 1
                continue
            }
            const parsed = new AssetDescriptor(a)
            parsedAssets[parsed.toFQAN()] = 1
        } catch (e) {
            throw errors.validationError('asset', `Invalid asset descriptor: "${a}". Expected format: {code}-{issuer}.`)
        }
    }

    const prices = [].concat(await Promise.all([
        findAssetPrices(network, Object.keys(parsedAssets)),
        findLiquidityPoolPrices(network, Object.keys(parsedPools))
    ])).flat()

    return preparePagedData(basePath, {
        asset: prices.map(p => p.asset),
        sort: 'asset',
        order: 'asc',
        allowedLinks: {
            self: 1
        }
    }, prices)
}

async function findAssetPrices(network, assets) {
    if (!assets.length)
        return []
    const foundAssets = await db[network].collection('assets')
        .find({name: {$in: assets}})
        .sort({name: 1})
        .project({_id: 0, name: 1, lastPrice: 1})
        .toArray()
    return foundAssets
        .filter(a => a.lastPrice > 0)
        .map(a => ({
            asset: a.name,
            price: a.lastPrice
        }))
}

async function findLiquidityPoolPrices(network, pools) {
    if (!pools.length)
        return []
    const foundPools = await db[network].collection('liquidity_pools')
        .find({hash: {$in: pools}})
        .sort({hash: 1})
        .project({_id: 0, hash: 1, shares: 1, tvl: 1})
        .toArray()

    return foundPools
        .map(p => ({
            asset: p.hash,
            price: p.shares > 0 ? p.tvl / p.shares : 0
        }))
        .filter(p => p.price > 0)
}

module.exports = {queryAssetPrices}