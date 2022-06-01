const db = require('../../connectors/mongodb-connector')

class LiquidityPoolAssetMatcher {
    constructor(assets) {
        this.assets = assets
    }

    match(pool, callback) {
        return pool.asset.map((a, i) => {
            const pa = a === 0 ? xlmMeta : this.assets.find(pa => pa._id === a)
            return callback(pa, i, pool)
        })
    }
}

const xlmMeta = {
    name: 'XLM',
    domain: 'stellar.org',
    toml_info: {
        image: 'https://stellar.expert/img/vendor/stellar.svg',
        orgName: 'Stellar',
        name: 'Lumen'
    }
}

/**
 *
 * @param {String} network
 * @param {Array<LiquidityPool>|LiquidityPool} pool
 * @return {Promise<LiquidityPoolAssetMatcher>}
 */
async function matchPoolAssets(network, pool) {
    let assetsToMatch = []
    if (!(pool instanceof Array)) {
        pool = [pool]
    }
    for (let {asset} of pool) {
        for (let a of asset)
            if (a > 0 && !assetsToMatch.includes(a)) {
                assetsToMatch.push(a)
            }
    }
    const poolAssets = await db[network].collection('assets')
        .find({_id: {$in: assetsToMatch}})
        .project({name: 1, domain: 1, tomlInfo: 1})
        .toArray()
    return new LiquidityPoolAssetMatcher(poolAssets)
}

module.exports = {matchPoolAssets}