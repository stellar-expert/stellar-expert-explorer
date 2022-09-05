const db = require('../../connectors/mongodb-connector')
const priceTracker = require('../../business-logic/ticker/price-tracker')
const {aggregateOhlcvt, encodeAssetOhlcvtId, OHLCVT} = require('../dex/ohlcvt-aggregator')
const {validateNetwork, validateAssetName} = require('../validators')
const {resolveAssetId} = require('./asset-resolver')
const {unixNow} = require('../../utils/date-utils')
const errors = require('../errors')

async function queryAssetStatsHistory(network, asset) {
    validateNetwork(network)
    validateAssetName(asset)

    const assetId = await resolveAssetId(network, asset)
    if (assetId === null)
        throw errors.notFound('Asset statistics not found on the ledger. Check if you specified the asset identifier correctly.')

    const stats = await db[network].collection('asset_history')
        .find({asset: assetId, _id: {$gt: 0}})
        .sort({_id: 1})
        .toArray()

    //TODO: temporary patch, remove this once all downstream clients switch to the new format
    const newFormatSwitchTimestamp = 1659916800
    const patchFromIndex = stats.findIndex(s => s.ts >= newFormatSwitchTimestamp)

    if (patchFromIndex >= 0) {
        const ohlcvtData = await aggregateOhlcvt({
            network,
            collection: 'asset_ohlcvt',
            order: 1,
            resolution: 86400, //1 day
            fromId: encodeAssetOhlcvtId(assetId, newFormatSwitchTimestamp),
            toId: encodeAssetOhlcvtId(assetId, unixNow() + 10)
        })

        for (let i = patchFromIndex; i < stats.length; i++) {
            const stat = stats[i]
            const ohlcvt = ohlcvtData.find(prices => prices[OHLCVT.TIMESTAMP] === stat.ts)
            if (!ohlcvt) {
                stat.price = []
                stat.trades = 0
                stat.tradedAmount = 0
            } else {
                const xlmPrice = await priceTracker.getPrice(stat.ts)
                stat.price = ohlcvt.slice(OHLCVT.OPEN, OHLCVT.CLOSE + 1).map(v => v / xlmPrice)
                stat.trades = ohlcvt[OHLCVT.TRADES_COUNT]
                stat.tradedAmount = ohlcvt[OHLCVT.BASE_VOLUME]
            }
        }
    }

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

        if (assetId > 0) {
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

    if (assetId === 0) {
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