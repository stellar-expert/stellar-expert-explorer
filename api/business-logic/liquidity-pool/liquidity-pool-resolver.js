const {BaseIdResolver, BatchJSONResolver} = require('../base-id-resolver')
const db = require('../../connectors/mongodb-connector')

class LiquidityPoolResolver extends BaseIdResolver {
    constructor() {
        super(1000)
    }

    async search(network, query) {
        const data = await db[network].collection('liquidity_pools')
            .find(query)
            .project({_id: 1, hash: 1})
            .toArray()
        return data.map(pool => ({_id: pool._id, value: pool.hash}))
    }

    async searchByValue(network, filter) {
        return this.search(network, {hash: {$in: filter}})
    }

    async searchById(network, filter) {
        return this.search(network, {_id: {$in: filter}})
    }
}

const liquidityPoolResolver = new LiquidityPoolResolver()

/**
 * @param {String} network
 * @param {String|[String]} poolHash
 * @return {Promise<Number|null>}
 */
async function resolveLiquidityPoolId(network, poolHash) {
    return await liquidityPoolResolver.resolveSingleId(network, poolHash)
}

/**
 * @param {String} network
 * @param {Number|[Number]} poolId
 * @return {Promise<[String]>}
 */
async function resolveLiquidityPoolHash(network, poolId) {
    return await liquidityPoolResolver.resolveSingleValue(network, poolId)
}

class LiquidityPoolJSONResolver extends BatchJSONResolver {
    constructor(network) {
        super(liquidityPoolResolver, network)
    }
}

module.exports = {resolveLiquidityPoolId, resolveLiquidityPoolHash, LiquidityPoolJSONResolver}