const db = require('../../connectors/mongodb-connector'),
    {validateNetwork, validateAssetName} = require('../validators'),
    AssetDescriptor = require('./asset-descriptor'),
    errors = require('../errors')

async function queryAssetStatsHistory(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetInfo = await db[network].collection('assets')
        .findOne({name: new AssetDescriptor(asset).toFQAN()}, {projection: {_id: 1}})

    if (!assetInfo) throw errors.notFound('Asset statistics were not found on the ledger. Check if you specified the asset correctly.')

    const stats = await db[network].collection('asset_history')
        .find({asset: assetInfo._id, _id: {$gt: 0}})
        .sort({_id: 1})
        .toArray()

    let lastReserve = 0
    const history = stats.map(stat => {
        const tick = {
            ts: stat.ts,
            supply: (typeof stat.supply === 'number') ? stat.supply : stat.supply.toNumber(),
            trustlines: stat.trustlines,
            payments: stat.payments,
            payments_amount: stat.paymentsAmount,
            trades: stat.trades,
            traded_amount: stat.tradedAmount
        }

        if (tick.trustlines.authorized < 0) {
            tick.trustlines.authorized = 0
        }

        if (assetInfo._id > 0) {
            Object.assign(tick, {
                price: stat.price,
                volume: stat.volume
            })
        } else {
            if (stat.reserve === undefined) {
                tick.reserve = lastReserve
            } else {
                lastReserve = tick.reserve = (typeof stat.reserve === 'number') ? stat.reserve : stat.reserve.toNumber()
            }
        }
        return tick
    })

    if (assetInfo._id === 0) {
        //fetch historical fee pool data for XLM
        const poolHistory = await db[network].collection('network_stats')
            .find({_id: {$gt: 0}})
            .sort({_id: 1})
            .project({fee_pool: 1})
            .toArray()
        for (let poolEntry of poolHistory) {
            poolEntry.ts = poolEntry._id
        }
        let assetCursor = 0, poolCursor = 0, lastPoolValue
        while (true) {
            const poolRecord = poolHistory[poolCursor],
                assetRecord = history[assetCursor]
            if (!assetRecord) break
            if (poolRecord && assetRecord.ts < poolRecord.ts) {
                //use pool value from the previous ledger history entry
                assetRecord.feePool = lastPoolValue.fee_pool.toNumber()
                assetCursor++
                continue
            }
            //update last pool record
            if (poolRecord) {
                lastPoolValue = poolRecord
                if (assetRecord.ts === lastPoolValue.ts) { //both records match
                    assetRecord.feePool = lastPoolValue.fee_pool.toNumber()
                    assetCursor++
                    poolCursor++
                    continue
                }
            }
            //look for a matching pool record for an asset history
            if (assetRecord.ts > lastPoolValue.ts) {
                if (!poolRecord) { //we don't have a matching ledger history entry
                    assetRecord.feePool = lastPoolValue.fee_pool.toNumber()
                    assetCursor++
                } else {
                    //current ledger history entry is too old - jump to the next entry
                    poolCursor++
                }
                continue
            }
        }
    }

    return history
}

module.exports = {queryAssetStatsHistory}