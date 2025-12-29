const {retrieveAssetsMetadata} = require('../asset/asset-meta-resolver')

class LiquidityPoolAssetMatcher {
    constructor(assets) {
        this.assets = new Map(assets.map(a => [a.name, a]))
    }

    match(pool, callback) {
        return pool.asset.map((a, i) => {
            const {_id, ...assetProps} = this.assets.get(a)
            if (!callback)
                return assetProps
            return callback(assetProps, i, pool)
        })
    }
}

/**
 * Retrieve assets for a given liquidity pool
 * @param {String} network - Stellar network
 * @param {Array<LiquidityPool>|LiquidityPool} pool - Pools to match
 * @return {Promise<LiquidityPoolAssetMatcher>}
 */
async function matchPoolAssets(network, pool) {
    if (!(pool instanceof Array)) {
        pool = [pool]
    }
    const assetsToMatch = new Set()
    for (const {asset} of pool) {
        for (const a of asset)
            assetsToMatch.add(a)
    }
    const poolAssets = await retrieveAssetsMetadata(network, Array.from(assetsToMatch))
    return new LiquidityPoolAssetMatcher(poolAssets)
}

module.exports = {matchPoolAssets}