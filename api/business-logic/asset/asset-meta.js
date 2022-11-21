const errors = require('../errors')
const db = require('../../connectors/mongodb-connector')
const {preparePagedData} = require('../api-helpers')
const {validateNetwork} = require('../validators')
const {matchPoolAssets} = require('../liquidity-pool/liquidity-pool-asset-matcher')
const {retrieveAssetsMetadata} = require('./asset-meta-resolver')
const AssetDescriptor = require('./asset-descriptor')

const limit = 50

async function findLiquidityPools(network, pools) {
    if (!pools.length) return []
    const foundPools = await db[network].collection('liquidity_pools')
        .find({hash: {$in: pools}})
        .project({hash: 1, asset: 1, type: 1, fee: 1, _id: 0})
        .toArray()

    const poolAssets = await matchPoolAssets(network, foundPools)

    for (const pool of foundPools) {
        pool.name = pool.paging_token = pool.hash
        pool.assets = poolAssets.match(pool)
        delete pool.hash
        delete pool.asset
    }

    return foundPools
}

async function findAssets(network, assets) {
    const foundAssets = await retrieveAssetsMetadata(network, assets)
    for (const a of foundAssets) {
        a.paging_token = a.name
    }
    return foundAssets
}

/**
 * Retrieve metadata for a group of assets or liquidity pools
 * @param {String} network - Stellar network
 * @param {String} basePath - Relative request base path
 * @param {{}} query - Query params
 * @return {Promise<MultiRows>}
 */
async function queryAssetsMeta(network, basePath, query) {
    validateNetwork(network)
    const {asset} = query
    if (!(asset instanceof Array))
        throw errors.badRequest('Invalid parameter "asset". Expected an array of assets to fetch.')
    if (!asset.length)
        throw errors.badRequest('No assets provided in the request.')
    if (asset.length > limit)
        throw errors.badRequest('Too many "asset" conditions. Maximum 50 searched assets allowed.')
    const assets = []
    const pools = []
    for (const a of asset) {
        try {
            if (/^[a-f0-9]{64}$/.test(a)) {
                if (!pools.includes(a)) {
                    pools.push(a)
                }
                continue
            }
            const aid = new AssetDescriptor(a).toFQAN()
            if (!assets.includes(aid)) {
                assets.push(aid)
            }
        } catch (e) {
            throw errors.badRequest(`Invalid asset name: "${a}".`)
        }
    }

    //resolve liquidity pools meta
    const foundPools = await findLiquidityPools(network, pools)

    //find assets
    let foundAssets = await findAssets(network, assets)
    foundAssets = foundAssets.concat(foundPools)

    for (const record of foundAssets) {
        delete record._id
    }

    foundAssets.sort((a, b) => a.asset - b.asset)

    return preparePagedData(basePath, {
        sort: 'name',
        order: 'asc',
        asset: foundAssets.map(a => a.asset),
        allowedLinks: {
            self: 1
        }
    }, foundAssets)
}

module.exports = {queryAssetsMeta}