const db = require('../../connectors/mongodb-connector')
const {normalizeOrder} = require('../api-helpers')
const {formatWithPrecision} = require('../../utils/formatter')
const {maxUnixTime, unixNow, trimDate} = require('../../utils/date-utils')
const errors = require('../errors')

const standardResolutions = [
    300, //5 minutes
    900, //15 minutes
    1800, //30 minutes
    3600, //1 hour
    7200, //2 hours
    14400, //4 hours
    43200, //12 hours
    86400, //1 day
    259200, //3 days
    604800, //1 week
    1209600 //2 weeks
]

const OHLCVT = {
    TIMESTAMP: 0,
    OPEN: 1,
    HIGH: 2,
    LOW: 3,
    CLOSE: 4,
    BASE_VOLUME: 5,
    QUOTE_VOLUME: 6,
    TRADES_COUNT: 7
}

/**
 *
 * @param {'public'|'testnet'} network
 * @param {'asset_ohlcvt'|'market_ohlcvt'} collection
 * @param {{}} predicate
 * @param {1|-1} order
 * @param {Number} from
 * @param {Number} to
 * @param {Number} resolution
 * @param {Boolean} reverse
 * @return {Promise<[][]>}
 */
async function aggregateOhlcvt({network, collection, predicate, order, from, to, resolution, reverse}) {
    const scale = chooseScaleOhlcvtScale(resolution)
    const rangeFrom = trimDate(from, 24)

    let data = await db[network].collection(collection).aggregate(
        [
            {$match: {...predicate, 'd.0.0': {$gte: rangeFrom, $lt: to}}},
            {$replaceRoot: {newRoot: {ohlcvt: scale}}},
            {$unwind: {path: '$ohlcvt'}},
            {$match: {['ohlcvt.' + OHLCVT.TIMESTAMP]: {$gte: from, $lt: to}}},
            {
                $group: {
                    _id: {$floor: {$divide: [{$arrayElemAt: ['$ohlcvt', OHLCVT.TIMESTAMP]}, resolution]}},
                    o: {$first: {$arrayElemAt: ['$ohlcvt', OHLCVT.OPEN]}},
                    h: {$max: {$arrayElemAt: ['$ohlcvt', OHLCVT.HIGH]}},
                    l: {$min: {$arrayElemAt: ['$ohlcvt', OHLCVT.LOW]}},
                    c: {$last: {$arrayElemAt: ['$ohlcvt', OHLCVT.CLOSE]}},
                    vb: {$sum: {$arrayElemAt: ['$ohlcvt', OHLCVT.BASE_VOLUME]}},
                    vq: {$sum: {$arrayElemAt: ['$ohlcvt', OHLCVT.QUOTE_VOLUME]}},
                    t: {$sum: {$arrayElemAt: ['$ohlcvt', OHLCVT.TRADES_COUNT]}}
                }
            },
            {$sort: {_id: order}},
            {
                $project: {
                    _id: 0,
                    r: {$map: {input: {$objectToArray: '$$ROOT'}, as: 'record', in: '$$record.v'}}
                }
            }
        ]
    ).toArray()
    data = data.map(({r}) => {
        r[OHLCVT.TIMESTAMP] *= resolution
        r[OHLCVT.QUOTE_VOLUME] = Math.floor(Number(r[OHLCVT.QUOTE_VOLUME]))
        r[OHLCVT.BASE_VOLUME] = Math.floor(Number(r[OHLCVT.BASE_VOLUME]))
        if (reverse)
            return reverseRecordSides(r)
        return r
    })
    return data
}

/**
 * Aggregate weighted prices (base_volume/quote_volume)
 * @param {'public'|'testnet'} network
 * @param {'asset_ohlcvt'|'market_ohlcvt'} collection
 * @param {{}} predicate
 * @param {1|-1} order
 * @param {Number} from
 * @param {Number} to
 * @param {Number} resolution
 * @return {Promise<{Object,<string,number[]>>}
 */
async function aggregateWeightedPrices({network, collection, predicate, order, from, to, resolution}) {
    const scale = chooseScaleOhlcvtScale(resolution)
    const rangeFrom = trimDate(from, 24)
    const assetSelector = collection === 'asset_ohlcvt' ? '$asset' : '$assets'

    let data = await db[network].collection(collection).aggregate(
        [
            {$match: {...predicate, 'd.0.0': {$gte: rangeFrom, $lt: to}}},
            {$replaceRoot: {newRoot: {asset: assetSelector, ohlcvt: scale}}},
            {$unwind: {path: '$ohlcvt'}},
            {$match: {['ohlcvt.' + OHLCVT.TIMESTAMP]: {$gte: from, $lt: to}}},
            {
                $group: {
                    _id: {
                        asset: '$asset',
                        ts: {$floor: {$divide: [{$arrayElemAt: ['$ohlcvt', OHLCVT.TIMESTAMP]}, resolution]}}
                    },
                    vb: {$sum: {$arrayElemAt: ['$ohlcvt', OHLCVT.BASE_VOLUME]}},
                    vq: {$sum: {$arrayElemAt: ['$ohlcvt', OHLCVT.QUOTE_VOLUME]}}
                }
            },
            {$project: {_id: 0, asset: '$_id.asset', ts: '$_id.ts', price: {$divide: ['$vq', '$vb']}}},
            {$sort: {asset: 1, ts: order}}
        ]
    ).toArray()
    const res = {}
    for (const {asset, ts, price} of data) {
        const assetKey = asset instanceof Array ? asset.join('/') : asset
        let container = res[assetKey] ?? (res[assetKey] = [])
        container.push([ts, price])
    }
    return res
}

/**
 *
 * @param {'public'|'testnet'} network
 * @param {'asset_ohlcvt'|'market_ohlcvt'} collection
 * @param {*} assetFilter
 * @param {Number} ts - Point in time
 * @param {Number} [ignoreStale] - Days to consider prices stale. Default: 30 days.
 * @return {Promise<Map<string,number>>}
 */
async function locateOhlcPrice(network, collection, assetFilter, ts = undefined, ignoreStale = 30) {
    const filterKey = collection === 'asset_ohlcvt' ? 'asset' : 'assets'
    const filter = assetFilter ? {[filterKey]: assetFilter} : {}

    const tsFilter = {}
    if (ts) { //search for given point-in-time
        tsFilter.$lte = ts
    }
    if (ignoreStale) {  //ignore prices older than N days
        tsFilter.$gt = (ts || unixNow()) - ignoreStale * 24 * 60 * 60
    }
    if (Object.keys(tsFilter).length) {
        filter['d.0.0'] = tsFilter
    }
    const pipeline = [
        {$match: filter},
        {$sort: {'d.0.0': -1}},
        {
            $group: {
                _id: collection === 'asset_ohlcvt' ? '$asset' : '$assets',
                price: {
                    $first: {values: ts ? '$5m' : '$d'}
                },
                ts: {
                    $first: {
                        $arrayElemAt: [{$first: '$d'}, OHLCVT.TIMESTAMP]
                    }
                }
            }
        }
    ]

    const data = await db[network].collection(collection).aggregate(pipeline).toArray()
    const res = new Map()
    for (const {_id, price} of data) {
        const tsPriceRecord = price.values.findLast(record => !ts || record[OHLCVT.TIMESTAMP] <= ts)
        if (!tsPriceRecord)
            continue
        const weightedPrice = tsPriceRecord[OHLCVT.QUOTE_VOLUME] / tsPriceRecord[OHLCVT.BASE_VOLUME] //weighted average price for a given period
        res.set(_id, weightedPrice)
    }
    return res
}

/**
 * Loads daily asset/market prices sorted in descending order by timestamp
 * @param {'public'|'testnet'} network
 * @param {'asset_ohlcvt'|'market_ohlcvt'} collection
 * @param {*} assetFilter
 * @param {number} [from]
 * @return {Promise<Object<string,{ts:number,price:number}[]>>}
 */
async function loadDailyOhlcPrices(network, collection, assetFilter, from) {
    const filterKey = collection === 'asset_ohlcvt' ? 'asset' : 'assets'
    const filter = assetFilter ? {[filterKey]: assetFilter} : {}
    if (from) {
        filter['d.0.0'] = {$gte: from}
    }
    const pipeline = [
        {$match: filter},
        {$project: {price: {$first: '$d'}, asset: '$' + filterKey}},
        {
            $group: {
                _id: {asset: '$asset', ts: {$arrayElemAt: ['$price', OHLCVT.TIMESTAMP]}},
                price: {$first: {$arrayElemAt: ['$price', OHLCVT.CLOSE]}}
            }
        },
        {$sort: {_id: -1}}
    ]
    const data = await db[network].collection(collection).aggregate(pipeline).toArray()
    const res = {}
    for (const {_id, price} of data) {
        let container = res[_id.asset]
        if (!container) {
            container = res[_id.asset] = []
        }
        container.push({ts: _id.ts, price})
    }
    return res
}

/**
 * @param {Number|String} from
 * @param {Number|String} to
 * @param {Number|String} resolution
 * @param {Number|String} order
 * @param {Number} [maxRecords]
 * @return {{from: Number, to: Number, order: Number, resolution: Number}}
 */
function parseBoundaries({from = 0, to, resolution = 'auto', order}, maxRecords = 200) {
    from = parseInt(from, 10)
    if (isNaN(from) || from < 0 || from > maxUnixTime)
        throw errors.validationError('from')
    if (to !== undefined) {
        to = parseInt(to, 10)
        if (isNaN(to) || to < 0 || to > maxUnixTime)
            throw errors.validationError('to')
        if (to <= from)
            throw errors.badRequest('Parameter "to" should be larger than "from".')
    }
    if (resolution !== 'auto') {
        resolution = parseInt(resolution, 10)
        if (!standardResolutions.includes(resolution))
            throw errors.validationError('resolution')
    }

    order = normalizeOrder(order, 1)
    resolution = optimizeResolution(from, to, resolution, maxRecords)
    if (to === undefined) {
        to = Math.min(from + resolution * maxRecords, maxUnixTime)
    }
    return {from, to, order, resolution}
}

/**
 * @param {Number} from
 * @param {Number} to
 * @param {Number|String} originalResolution
 * @param {Number} maxRecords
 * @return {Number}
 */
function optimizeResolution(from, to, originalResolution, maxRecords) {
    //upper boundary not specified
    if (to === undefined) {
        if (!standardResolutions.includes(originalResolution))
            return standardResolutions[standardResolutions.length - 1]
        return originalResolution
    }
    //auto-adjust
    const span = to - from
    if (originalResolution && originalResolution !== 'auto') {
        if (standardResolutions.includes(originalResolution)) {
            if (span / originalResolution <= maxRecords)
                return originalResolution
            if (standardResolutions[standardResolutions.length - 1] === originalResolution)
                return originalResolution
        }
    }
    const optimal = span / maxRecords
    const res = standardResolutions.find(v => v >= optimal)
    return res || standardResolutions[standardResolutions.length - 1]
}

function reverseRecordSides(record) {
    return [
        record[OHLCVT.TIMESTAMP],
        parseFloat(formatWithPrecision(1 / record[OHLCVT.OPEN], 6)),
        parseFloat(formatWithPrecision(1 / record[OHLCVT.LOW], 6)), //swap high and low
        parseFloat(formatWithPrecision(1 / record[OHLCVT.HIGH], 6)),
        parseFloat(formatWithPrecision(1 / record[OHLCVT.CLOSE], 6)),
        record[OHLCVT.QUOTE_VOLUME],
        record[OHLCVT.BASE_VOLUME],
        record[OHLCVT.TRADES_COUNT]
    ]
}

function chooseScaleOhlcvtScale(resolution) {
    let scale = '$5m'
    if (resolution >= 14400) { //switch to hi-res collection with larger timeframes
        if (resolution >= 86400) {
            scale = '$d'
        } else {
            scale = '$4h'
        }
    }
    return scale
}

module.exports = {
    locateOhlcPrice,
    aggregateOhlcvt,
    loadDailyOhlcPrices,
    aggregateWeightedPrices,
    parseBoundaries,
    OHLCVT
}