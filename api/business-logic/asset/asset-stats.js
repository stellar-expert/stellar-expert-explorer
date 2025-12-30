const {Networks} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validateAssetName, isValidContractAddress} = require('../validators')
const AssetDescriptor = require('./asset-descriptor')
const {estimateAssetPrices} = require('./asset-price')
const {combineAssetHistory} = require('./asset-aggregation')

async function queryAssetStats(network, asset) {
    validateNetwork(network)
    let query
    if (isValidContractAddress(asset)) {
        query = {$or: [{contract: asset}, {_id: asset}]}
    } else {
        asset = validateAssetName(asset)
        query = {_id: asset}
    }
    const assetInfo = await db[network].collection('assets').findOne(query)
    if (!assetInfo)
        throw errors.notFound('Asset statistics were not found on the ledger. Check if you specified the asset correctly.')

    const res = {
        asset,
        created: assetInfo.created,
        volume: Math.round(assetInfo.quoteVolume),
        volume7d: Math.round(assetInfo.volume7d),
        price7d: assetInfo.price7d
    }
    const [price] = (await estimateAssetPrices(network, [asset])).values()
    if (price) {
        res.price = price
    }
    const combinedStats = combineAssetHistory(assetInfo.history, asset !== 'XLM')
    const supplyInfo = await getSupplyInfo(network, assetInfo, combinedStats)
    Object.assign(res, supplyInfo)
    res.trades = combinedStats.trades
    res.traded_amount = combinedStats.tradedAmount
    res.payments = combinedStats.payments
    res.payments_amount = combinedStats.paymentsAmount
    res.trustlines = {
        total: combinedStats.trustlines[0],
        authorized: combinedStats.trustlines[1],
        funded: combinedStats.trustlines[2]
    }

    if (assetInfo.tomlInfo) {
        res.toml_info = assetInfo.tomlInfo
        res.home_domain = assetInfo.domain
    }
    if (assetInfo.rating) {
        res.rating = assetInfo.rating
    }
    if (!isValidContractAddress(asset)) {
        const contractAddress = new AssetDescriptor(asset).toStellarAsset().contractId(Networks[network.toUpperCase()])
        const contract = await db[network].collection('contracts').findOne({_id: contractAddress}, {projection: {_id: 1}})
        if (contract) {
            res.contract = contractAddress
        }
    }

    return res
}

async function getSupplyInfo(network, asset, combinedStats) {
    if (asset._id !== 'XLM')
        return {supply: combinedStats.supply}
    //fetch fee pool and reserve for XLM
    const {fee_pool, total_xlm} = await db[network].collection('network_stats')
        .findOne({}, {sort: {_id: -1}, projection: {fee_pool: 1, total_xlm: 1}})

    const res = {fee_pool, supply: total_xlm}
    const rKeys = Object.keys(asset.reserve).map(key => parseInt(key, 10))
    res.reserve = asset.reserve[rKeys.sort().pop()] || 0n
    return res
}

module.exports = {queryAssetStats, getSupplyInfo}