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
    res.supply = combinedStats.supply
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
    if (asset !== 'XLM' && assetInfo.rating) {
        res.rating = assetInfo.rating
    }
    if (asset === 'XLM') {
        //fetch fee pool and reserve for XLM
        const {fee_pool} = await db[network].collection('network_stats')
            .findOne({}, {sort: {_id: -1}, projection: {fee_pool: 1}})
        res.fee_pool = fee_pool
        const rKeys = Object.keys(assetInfo.reserve).map(parseInt)
        const last = rKeys.sort().pop()
        res.reserve = assetInfo.reserve[last] || 0n
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

module.exports = {queryAssetStats}