const {Long, ObjectId} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {normalizeOrder} = require('../api-helpers')
const {formatWithPrecision} = require('../../utils/formatter')
const {maxUnixTime} = require('../../utils/date-utils')
const errors = require('../errors')

const standardResolutions = [
    300, //5 minutes
    900, //15 minutes
    1800, //15 minutes
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
 * @param {String} collection
 * @param {1|-1} order
 * @param {*} fromId
 * @param {*} toId
 * @param {Number} resolution
 * @param {Boolean} reverse
 * @return {Promise<[][]>}
 */
async function aggregateOhlcvt({network, collection, order, fromId, toId, resolution, reverse}) {
    if (resolution >= 14400) {
        collection += '4h' //switch to hi-res collection with larger timeframes
    }
    let data = await db[network].collection(collection).aggregate(
        [
            {
                $match: {_id: {$gte: fromId, $lt: toId}}
            },
            {
                $sort: {_id: 1}
            },
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
            {
                $sort: {_id: order}
            },
            {
                $project: {
                    _id: 0,
                    r: {
                        $map: {
                            input: {$objectToArray: '$$ROOT'}, as: 'record', in: '$$record.v'
                        }
                    }
                }
            }
        ]
    ).toArray()
    data = data.map(({r}) => {
        r[OHLCVT.TIMESTAMP] *= resolution
        r[OHLCVT.QUOTE_VOLUME] = Math.floor(r[OHLCVT.QUOTE_VOLUME])
        r[OHLCVT.BASE_VOLUME] = Math.floor(r[OHLCVT.BASE_VOLUME])
        if (reverse) return reverseRecordSides(r)
        return r
    })
    return data
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

/**
 * @param {Number} from
 * @param {Number} to
 * @param {Number|String} originalResolution
 * @return {Number}
 */
function optimizeResolution(from, to, originalResolution) {
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
            if (span / originalResolution <= 200)
                return originalResolution
            if (standardResolutions[standardResolutions.length - 1] === originalResolution)
                return originalResolution
        }
    }
    const optimal = span / 200
    const res = standardResolutions.find(v => v >= optimal)
    return res || standardResolutions[standardResolutions.length - 1]
}

/**
 * @param {Number|String} from
 * @param {Number|String} to
 * @param {Number|String} resolution
 * @param {Number|String} order
 * @return {{from: Number, to: Number, order: Number, resolution: Number}}
 */
function parseBoundaries({from = 0, to, resolution = 'auto', order}) {
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
    resolution = optimizeResolution(from, to, resolution)
    if (to === undefined) {
        to = Math.min(from + resolution * 200, maxUnixTime)
    }
    return {from, to, order, resolution}
}


/**
 * Generate OHLCVT collection id from asset id and timestamp
 * @param {Number} assetId
 * @param {Number} timestamp
 * @return {Long}
 */
function encodeAssetOhlcvtId(assetId, timestamp) {
    return new Long(timestamp, assetId)
}


/**
 * Generate OHLCVT collection id from two asset ids that designate the market and timestamp
 * @param {Number[]|Long} assetIds
 * @param {Number} timestamp
 * @return {ObjectId}
 */
function encodeMarketOhlcvtId(assetIds, timestamp) {
    const raw = Buffer.allocUnsafe(12)
    if (assetIds instanceof Long) {
        raw.writeUInt32BE(assetIds.getHighBits(), 0)
        raw.writeUInt32BE(assetIds.getLowBits(), 4)
    } else {
        raw.writeUInt32BE(assetIds[1], 0)
        raw.writeUInt32BE(assetIds[0], 4)
    }
    raw.writeUInt32BE(timestamp, 8)
    return new ObjectId(raw)
}

module.exports = {aggregateOhlcvt, parseBoundaries, encodeAssetOhlcvtId, encodeMarketOhlcvtId, OHLCVT}