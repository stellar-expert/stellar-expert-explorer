const {Long} = require('mongodb')
const {Networks} = require('@stellar/stellar-sdk')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validateAssetName} = require('../validators')
const {anyToNumber} = require('../../utils/formatter')
const AssetDescriptor = require('./asset-descriptor')

async function queryAssetStats(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({name: new AssetDescriptor(asset).toFQAN()})

    if (!assetInfo)
        throw errors.notFound('Asset statistics were not found on the ledger. Check if you specified the asset correctly.')

    const res = {
        asset: assetInfo.name,
        created: assetInfo.created,
        supply: anyToNumber(assetInfo.supply),
        trustlines: {
            total: assetInfo.trustlines[0],
            authorized: assetInfo.trustlines[1],
            funded: assetInfo.trustlines[2]
        },
        payments: assetInfo.payments,
        payments_amount: assetInfo.paymentsAmount,
        trades: assetInfo.totalTrades,
        traded_amount: assetInfo.baseVolume,
        price: assetInfo.lastPrice,
        volume: Math.round(assetInfo.quoteVolume),
        volume7d: Math.round(assetInfo.volume7d),
        price7d: assetInfo.price7d
    }

    if (res.trustlines.authorized < 0) {
        res.trustlines.authorized = 0
    }
    if (assetInfo.tomlInfo) {
        res.toml_info = assetInfo.tomlInfo
        res.home_domain = assetInfo.domain
    }

    if (assetInfo._id > 0) {
        Object.assign(res, {
            rating: assetInfo.rating
        })
    }
    if (assetInfo._id === 0) {
        //fetch fee pool and reserve for XLM
        const [xlmHistory, poolHistory] = await Promise.all([
            db[network].collection('asset_history')
                .find({
                    _id: {
                        $gt: new Long(0, assetInfo._id),
                        $lt: new Long(0, assetInfo._id + 1)
                    }
                })
                .sort({_id: -1})
                .limit(2)
                .project({reserve: 1})
                .toArray(),
            db[network].collection('network_stats')
                .find({})
                .sort({_id: -1})
                .project({fee_pool: 1})
                .limit(1)
                .toArray()
        ])
        res.fee_pool = poolHistory[0].fee_pool
        if (xlmHistory[0] && xlmHistory[0].reserve) {
            res.reserve = xlmHistory[0].reserve
        } else {
            if (xlmHistory.length > 1) {
                const {reserve} = xlmHistory[1]
                res.reserve = reserve || '0'
            } else {
                res.reserve = '0'
            }
        }
    }
    if (assetInfo._id < (1 << 30)) { //classic asset - try of find soroban contract
        const contractId = new AssetDescriptor(assetInfo.name).toStellarAsset().contractId(Networks[network.toUpperCase()])
        //check if contract exists
        const contractInfo = await db[network].collection('assets').findOne({name: contractId})
        if (contractInfo) {
            res.contractAsset = contractId
        }
    } else if (assetInfo.code) { //Soroban asset bound to classic asset
        const query = {code: assetInfo.code}
        if (assetInfo.issuer) {
            query.issuer = assetInfo.issuer
        } else if (assetInfo.code !== 'XLM')
            throw new Error('Invalid contract asset code/issuer binding - ' + assetInfo.code)
        const classicInfo = await db[network].collection('assets').findOne(query)
        if (classicInfo) {
            res.classicAsset = classicInfo.name
        }
    }

    return res
}

module.exports = {queryAssetStats}