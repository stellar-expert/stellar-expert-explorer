const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {isContractId} = require('../../utils/id-utils')
const {encodeAssetOhlcvtId} = require('../dex/ohlcvt-aggregator')
const {encodeBsonId} = require('../../utils/bson-id-encoder')

async function estimateTrustlinesValue(network, accountId, ts) {
    const trustlines = ts ?
        await loadHistoricalAccountTrustlines(network, accountId, ts) :
        await loadCurrentAccountTrustlines(network, accountId)

    const tamap = new Map()
    for (let t of trustlines) {
        tamap.set(t.asset, t)
    }
    const assets = await db[network].collection('assets')
        .find({_id: {$in: trustlines.map(t => t.asset)}})
        .project({name: 1, lastPrice: 1})
        .toArray()
    for (let a of assets) {
        const trustline = tamap.get(a._id)
        trustline.asset = a.name
        trustline.value = a.lastPrice ? Math.floor(Number(trustline.balance) * a.lastPrice) : 0
    }

    if (ts) {
        const prices = await loadHistoricalPrices(network, tamap.keys().toArray(), ts)
        for (const {_id, price} of prices) {
            const trustline = tamap.get(_id)
            trustline.value = Math.floor(Number(trustline.balance) * price)
        }
    }

    const xlmIdx = trustlines.findIndex(t => t.asset === 'XLM')
    if (xlmIdx < 0) { //no XLM trustline found
        if (!isContractId(accountId)) {
            trustlines.unshift({
                asset: 'XLM',
                balance: 0n,
                value: 0,
                flags: 1
            })
        }
    } else if (xlmIdx > 0) {
        const [xlmTrustline] = trustlines.splice(xlmIdx, 1)
        trustlines.unshift(xlmTrustline)
    }

    return trustlines
}

async function loadHistoricalPrices(network, assetIds, ts) {
    const ranges = assetIds.map(aid => ({
        _id: {
            $gte: encodeAssetOhlcvtId(aid, 0),
            $lte: encodeAssetOhlcvtId(aid, ts)
        }
    }))
    return await db[network].collection('asset_ohlcvt4h').aggregate([
        {
            $match: {
                $or: ranges
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $group: {
                _id: {$toInt: {$divide: ['$_id', 4294967296]}},
                price: {$first: {$arrayElemAt: ['$ohlcvt', 1]}}
            }
        }
    ]).toArray()
}

function loadCurrentAccountTrustlines(network, accountId) {
    return db[network].collection('trustlines')
        .find({
            _id: {$gte: new Long(0, accountId), $lt: new Long(0, accountId + 1)},
            asset: {$gte: 0}
        })
        .project({balance: 1, asset: 1, flags: 1})
        .toArray()
}

async function loadHistoricalAccountTrustlines(network, accountId, ts) {
    const res = await db[network].collection('trustlines_history')
        .aggregate([
            {
                $match: {
                    _id: {
                        $gte: encodeBsonId(accountId, 0, 0),
                        $lt: encodeBsonId(accountId + 1, 0, 0)
                    },
                    asset: {$gte: 0}
                }
            },
            {
                $project: {
                    ts: {$substrBytes: [{$toString: '$_id'}, 16, 8]},
                    asset: 1,
                    balance: 1
                }
            },
            {
                $match: {
                    ts: {$lte: ts.toString(16)}
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $group: {
                    _id: '$asset',
                    asset: {$first: '$asset'},
                    balance: {$first: '$balance'}
                }
            }
        ])
        .toArray()

    for (let t of res) {
        t._id = (BigInt(accountId) << 32n) | BigInt(t.asset >>> 0)
        t.balance = t.balance.toBigInt()
    }
    return res
}

module.exports = {estimateTrustlinesValue}