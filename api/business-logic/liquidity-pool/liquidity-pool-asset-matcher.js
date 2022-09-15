const {retrieveAssetsMetadata} = require('../asset/asset-meta-resolver')

class LiquidityPoolAssetMatcher {
    constructor(assets) {
        this.assets = assets
    }

    match(pool, callback) {
        return pool.asset.map((a, i) => {
            const {_id, ...assetProps} = a === 0 ?
                xlmMeta :
                this.assets.find(pa => pa._id === a)
            if (!callback)
                return assetProps
            return callback(assetProps, i, pool)
        })
    }
}

const xlmMeta = {
    _id: 0,
    asset: 'XLM',
    name: 'XLM',
    domain: 'stellar.org',
    toml_info: {
        image: 'https://stellar.expert/img/vendor/stellar.svg',
        orgName: 'Stellar',
        name: 'Lumen'
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