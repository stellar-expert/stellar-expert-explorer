const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {anyToNumber} = require('../../utils/formatter')
const {validateNetwork, validateAssetName} = require('../validators')
const {aggregateOhlcvt, OHLCVT} = require('../dex/ohlcvt-aggregator')
const {rehydrateAssetHistory} = require('./asset-aggregation')

async function queryAssetStatsHistory(network, asset) {
    validateNetwork(network)
    asset = validateAssetName(asset)

    const assetInfo = await db[network].collection('assets').findOne({_id: asset})
    if (!assetInfo)
        throw errors.notFound()
    const stats = rehydrateAssetHistory(assetInfo.history, asset !== 'XLM')
    //TODO: temporary patch, remove this once all downstream clients switch to the new format
    if (!stats.length)
        return stats
    const ohlcvtData = await aggregateOhlcvt({
        network,
        collection: 'asset_ohlcvt',
        predicate: {asset},
        order: 1,
        resolution: 86400, //1 day
        from: stats[0].ts,
        to: stats[stats.length - 1].ts + 1,
        reverse: true
    })

    for (let i = 0; i < stats.length; i++) {
        const stat = stats[i]
        const ohlcvt = ohlcvtData.find(prices => prices[OHLCVT.TIMESTAMP] <= stat.ts)
        if (!ohlcvt) {
            stat.price = []
            stat.trades = 0
            stat.tradedAmount = 0
            stat.volume = 0
        } else {
            stat.price = ohlcvt.slice(OHLCVT.OPEN, OHLCVT.CLOSE + 1)
            stat.trades = ohlcvt[OHLCVT.TRADES_COUNT]
            stat.tradedAmount = ohlcvt[OHLCVT.BASE_VOLUME]
            stat.volume = ohlcvt[OHLCVT.QUOTE_VOLUME]
        }
    }

    let lastReserve = 1000000000000000000
    const history = stats.map(stat => {
        const tick = {
            ts: stat.ts,
            supply: anyToNumber(stat.supply),
            trustlines: stat.trustlines,
            payments: stat.payments,
            payments_amount: stat.paymentsAmount,
            trades: stat.trades,
            traded_amount: stat.tradedAmount,
            price: stat.price,
            volume: stat.volume
        }

        if (tick.trustlines.authorized < 0) {
            tick.trustlines.authorized = 0
        }

        if (asset !== 'XLM') {
        } else {
            const reserve = assetInfo.reserve[stat.ts]
            if (reserve === undefined) {
                tick.reserve = lastReserve
            } else {
                lastReserve = tick.reserve = Number(reserve)
            }
            tick.supply = undefined
        }
        return tick
    })

    if (asset === 'XLM') {
        //fetch historical fee pool data for XLM
        const poolHistory = await db[network].collection('network_stats')
            .find({_id: {$gt: 0}})
            .sort({_id: 1})
            .project({fee_pool: 1, total_xlm: 1})
            .toArray()
        for (const poolEntry of poolHistory) {
            poolEntry.ts = poolEntry._id
        }
        let assetCursor = 0
        let poolCursor = 0
        let lastPoolValue
        while (true) {
            const poolRecord = poolHistory[poolCursor]
            const assetRecord = history[assetCursor]
            if (!assetRecord)
                break
            if (poolRecord && assetRecord.ts < poolRecord.ts) {
                //use pool value from the previous ledger history entry
                assetRecord.fee_pool = lastPoolValue?.fee_pool || 0n
                assetRecord.supply = Number(lastPoolValue?.total_xlm || 1000000000000000000)
                assetCursor++
                continue
            }
            //update last pool record
            if (poolRecord) {
                lastPoolValue = poolRecord
                if (assetRecord.ts === lastPoolValue.ts) { //both records match
                    assetRecord.fee_pool = lastPoolValue.fee_pool
                    assetRecord.supply = Number(lastPoolValue.total_xlm)
                    assetCursor++
                    poolCursor++
                    continue
                }
            }
            //look for a matching pool record for an asset history
            if (assetRecord.ts > lastPoolValue.ts) {
                if (!poolRecord) { //we don't have a matching ledger history entry
                    assetRecord.fee_pool = lastPoolValue.fee_pool
                    assetRecord.supply = Number(lastPoolValue.total_xlm)
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