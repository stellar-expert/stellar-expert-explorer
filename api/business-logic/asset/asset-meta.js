const errors = require('../errors'),
    db = require('../../connectors/mongodb-connector'),
    QueryBuilder = require('../query-builder'),
    AssetDescriptor = require('./asset-descriptor'),
    {preparePagedData} = require('../api-helpers'),
    {validateNetwork} = require('../validators'),
    {matchPoolAssets} = require('../liquidity-pool/liquidity-pool-asset-matcher')

const xlmMeta = {
    name: 'XLM',
    domain: 'stellar.org',
    toml_info: {
        image: 'https://stellar.expert/img/vendor/stellar.svg',
        orgName: 'Stellar',
        name: 'Lumen'
    }
}

async function queryAssetsMeta(network, basePath, query) {
    validateNetwork(network)
    let {asset} = query
    if (!(asset instanceof Array))
        throw errors.badRequest('Invalid parameter "asset". Expected an array of assets to fetch.')
    if (!asset.length)
        throw errors.badRequest('No assets provided in the request.')
    if (asset.length > 50)
        throw errors.badRequest('Too many "asset" conditions. Maximum 50 searched assets allowed.')
    let assets = [],
        pools = []
    for (let a of asset) {
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
    let foundPools = await db[network].collection('liquidity_pools')
        .find({hash: {$in: pools}})
        .limit(50)
        .project({hash: 1, asset: 1, type: 1, fee: 1, _id: 0})
        .toArray()


    const poolAssets = await matchPoolAssets(network, foundPools)

    for (let pool of foundPools) {
        pool.name = pool.paging_token = pool.hash
        pool.assets = poolAssets.match(pool, (pa, i) => ({
            asset: pa.name,
            domain: pa.domain,
            toml_info: pa.tomlInfo || pa.toml_info
        })),
        delete pool.hash
        delete pool.asset
    }

    //find assets
    const q = new QueryBuilder({name: {$in: assets}, domain: {$exists: true}})
        .setLimit(50)

    let foundAssets = await db[network].collection('assets')
        .find(q.query)
        .limit(q.limit)
        .sort({name: 1})
        .project({name: 1, domain: 1, tomlInfo: 1, _id: 0})
        .toArray()

    for (let a of foundAssets) {
        a.paging_token = a.name
        a.toml_info = a.tomlInfo
        delete a.tomlInfo
    }

    if (assets.includes('XLM')) {
        foundAssets.splice(0, 0, xlmMeta)
    }
    foundAssets = foundAssets.concat(foundPools)

    return preparePagedData(basePath, {
        sort: 'name',
        order: 'asc',
        limit: q.limit
    }, foundAssets)
}

module.exports = {queryAssetsMeta}