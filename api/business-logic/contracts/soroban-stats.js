const db = require('../../connectors/mongodb-connector')
const {round} = require('../../utils/formatter')
const {validateNetwork} = require('../validators')
const {AccountAddressJSONResolver} = require('../account/account-resolver')

const day = 86400

function queryGeneralSorobanStats(network) {
    validateNetwork(network)
    const pipeline = [{
        $group: {
            _id: null,
            wasm: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 1, 0]}},
            sac: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 0, 1]}},
            payments: {$sum: '$payments'},
            invocations: {$sum: '$invocations'}
        }
    }]
    return db[network].collection('contracts').aggregate(pipeline)
        .toArray()
        .then(res => {
            const grouped = res[0]
            delete grouped._id
            return grouped
        })
}

async function querySorobanInteractionHistory(network) {
    validateNetwork(network)
    const results = await Promise.all([
        fetchContractCreationHistory(network),
        fetchContractMetricsHistory(network)
    ])
    const merged = new Map()
    for (const result of results) {
        for (const record of result) {
            if (!record.ts)
                continue
            const accumulator = merged.get(record.ts)
            if (!accumulator) {
                merged.set(record.ts, record)
            } else {
                Object.assign(accumulator, record)
            }
        }
    }
    const resArray = Array.from(merged.values())
    resArray.sort((a, b) => a.ts - b.ts)
    return resArray
}

async function fetchContractCreationHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$created', day]}},
                contracts_created: {$sum: 1}
            }
        },
        {
            $sort: {_id: 1}
        }
    ]
    const res = await db[network].collection('contracts').aggregate(pipeline).toArray()
    return res.map(entry => {
        entry.ts = entry._id * day
        delete entry._id
        return entry
    })
}

async function fetchContractMetricsHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$ts', day]}},
                total_read_entry: {$sum: '$metrics.read_entry'},
                total_write_entry: {$sum: '$metrics.write_entry'},
                total_ledger_read_byte: {$sum: '$metrics.ledger_read_byte'},
                total_ledger_write_byte: {$sum: '$metrics.ledger_write_byte'},
                total_read_code_byte: {$sum: '$metrics.read_code_byte'},
                total_mem_byte: {$sum: '$metrics.mem_byte'},
                total_emit_event: {$sum: '$metrics.emit_event'},
                //total_errors: {$sum: '$errors'},
                avg_invoke_time: {$avg: {$divide: ['$metrics.invoke_time_nsecs', 1000]}},
                total_uploads: {$sum: {$cond: [{$eq: ['$metrics.write_code_byte', 0]}, 0, 1]}},
                total_invocations: {$sum: 1},
                total_subinvocations: {$sum: '$calls'},
                total_nonrefundable_fee: {$sum: '$metrics.fee.nonrefundable'},
                total_refundable_fee: {$sum: '$metrics.fee.refundable'},
                total_rent_fee: {$sum: '$metrics.fee.rent'},
                avg_nonrefundable_fee: {$avg: '$metrics.fee.nonrefundable'},
                avg_refundable_fee: {$avg: '$metrics.fee.refundable'},
                avg_rent_fee: {$avg: '$metrics.fee.rent'}
            }
        },
        {
            $sort: {_id: 1}
        }
    ]
    return db[network].collection('invocations').aggregate(pipeline)
        .toArray()
        .then(res => res.map(({_id, ...entry}) => {
            entry.ts = _id * day
            entry.avg_invoke_time = round(entry.avg_invoke_time, 0)
            entry.avg_nonrefundable_fee = round(entry.avg_nonrefundable_fee, 0)
            entry.avg_refundable_fee = round(entry.avg_refundable_fee, 0)
            entry.avg_rent_fee = round(entry.avg_rent_fee, 0)
            return entry
        }))
}

async function queryContractFeeStatHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$ts', day]}},
                avgnonrefundable: {$avg: {$toInt: '$metrics.fee.nonrefundable'}},
                avgrefundable: {$avg: {$toInt: '$metrics.fee.refundable'}},
                avgrent: {$avg: {$toInt: '$metrics.fee.rent'}},
                totalnonrefundable: {$sum: {$toInt: '$metrics.fee.nonrefundable'}},
                totalrefundable: {$sum: {$toInt: '$metrics.fee.refundable'}},
                totalrent: {$sum: {$toInt: '$metrics.fee.rent'}}
            }
        },
        {
            $project: {
                _id: 0,
                ts: {$multiply: ['$_id', day]},
                avgFees: {
                    nonrefundable: '$avgnonrefundable',
                    refundable: '$avgrefundable',
                    rent: '$avgrent'
                },
                totalFees: {
                    nonrefundable: '$totalnonrefundable',
                    refundable: '$totalrefundable',
                    rent: '$totalrent'
                }
            }
        },
        {
            $sort: {ts: 1}
        }
    ]
    return db[network].collection('invocations').aggregate(pipeline).toArray()
}

async function queryTopContractsByInvocations(network, limit = 100) {
    const pipeline = [
        {
            $group: {
                _id: '$contract',
                invocations: {$sum: 1}
            }
        },
        {
            $match: {_id: {$gt: 0}}
        },
        {
            $sort: {invocations: -1}
        },
        {
            $limit: limit
        }
    ]

    const data = await db[network].collection('invocations').aggregate(pipeline).toArray()
    const accountResolver = new AccountAddressJSONResolver(network)

    for (const record of data) {
        record.contract = accountResolver.resolve(record._id)
        delete record._id
    }
    await accountResolver.fetchAll()
    return data
}

async function queryTopContractsBySubInvocations(network) {
    const pipeline = [
        {
            $match: {nested: {$exists: true}}
        },
        {
            $project: {
                _id: 0,
                nested: 1
            }
        },
        {
            $unwind: {
                path: '$nested',
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $group: {
                _id: '$nested',
                invocations: {$sum: 1}
            }
        },
        {
            $match: {_id: {$gt: 0}}
        },
        {
            $sort: {invocations: -1}
        },
        {
            $limit: 100
        }
    ]

    const data = await db[network].collection('invocations').aggregate(pipeline).toArray()
    const accountResolver = new AccountAddressJSONResolver(network)

    for (const record of data) {
        record.contract = accountResolver.resolve(record._id)
        delete record._id
    }

    await accountResolver.fetchAll()
    return data
}



module.exports = {
    queryGeneralSorobanStats,
    querySorobanInteractionHistory,
    queryContractFeeStatHistory,
    queryTopContractsByInvocations,
    queryTopContractsBySubInvocations
}