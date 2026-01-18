const errors = require('../errors')
const db = require('../../connectors/mongodb-connector')
const {preparePagedData} = require('../api-helpers')
const {validateNetwork, isValidPoolId, validatePoolId} = require('../validators')
const {matchPoolAssets} = require('../liquidity-pool/liquidity-pool-asset-matcher')
const AssetDescriptor = require('./asset-descriptor')
const {retrieveAssetsMetadata} = require('./asset-meta-resolver')

const limit = 50

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
    for (let a of asset) {
        try {
            if (isValidPoolId(a)) {
                a = validatePoolId(a)
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
    let foundAssets = await retrieveAssetsMetadata(network, assets)

    foundAssets = foundAssets.concat(foundPools)
    foundAssets.sort((a, b) => a.name.localeCompare(b.name))

    return preparePagedData(basePath, {
        asset: foundAssets.map(a => a.name),
        sort: 'name',
        order: 'asc',
        allowedLinks: {
            self: 1
        }
    }, foundAssets)
}

async function findLiquidityPools(network, pools) {
    if (!pools.length)
        return []
    const foundPools = await db[network].collection('liquidity_pools')
        .find({_id: {$in: pools}})
        .project({_id: 1, asset: 1, type: 1, fee: 1})
        .toArray()

    const poolAssets = await matchPoolAssets(network, foundPools)
    return foundPools.map(pool => {
        const {_id, asset, ...rest} = pool
        return {
            pool: _id,
            name: _id,
            assets: poolAssets.match(pool),
            ...rest
        }
    })
}

module.exports = {queryAssetsMeta}