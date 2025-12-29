const config = require('../../app.config')
const errors = require('../errors')
const db = require('../../connectors/mongodb-connector')
const {unixNow} = require('../../utils/date-utils')
const {round} = require('../../utils/formatter')
const {validateNetwork, validateContractAddress} = require('../validators')
const ShardedElasticQuery = require('../../connectors/sharded-elastic-query')

async function queryContractTopUsers(network, contract, func, since) {
    validateNetwork(network)
    validateContractAddress(contract)

    const elasticQuery = new ShardedElasticQuery(network, 'invocationIndex')

    const filter = buildInvocationFilters(contract, since, func)
    if (!filter)
        return []

    let rows = await elasticQuery.search({
        filter,
        aggs: {
            top: {
                terms: {
                    field: 'initiator',
                    size: 50
                }
            }
        },
        limit: 0
    })
    const result = rows.reduce((map, r) => {
        for (const {key, doc_count} of r.top.buckets) {
            let cnt = map.get(key) || 0
            map.set(key, cnt + doc_count)
        }
        return map
    }, new Map())

    const invokers = Array.from(result.entries()).sort((a, b) => b[1] - a[1])
    return invokers.map(([address, invocations]) => ({address, invocations}))
}

async function queryContractInvocationStats(network, contract, func, since) {
    throw new errors.forbidden('Temporary disabled') //TODO: aggregate in the analytics DB and reenable this API afterwards
    validateNetwork(network)
    validateContractAddress(contract)

    const elasticQuery = new ShardedElasticQuery(network, 'invocationIndex')

    const filter = buildInvocationFilters(contract, since, func)
    if (!filter)
        return []


    let rows = await elasticQuery.search({
        filter,
        aggs: {},
        limit: 0
    })

    const day = 86400
    let stats = await db[network]
        .collection('invocations')
        .aggregate([
            {
                $match: filter
            },
            {
                $group: {
                    _id: {$floor: {$divide: ['$ts', day]}},
                    avg_read_entry: {$avg: '$metrics.read_entry'},
                    avg_write_entry: {$avg: '$metrics.write_entry'},
                    avg_ledger_read_byte: {$avg: '$metrics.ledger_read_byte'},
                    avg_ledger_write_byte: {$avg: '$metrics.ledger_write_byte'},
                    avg_mem_byte: {$avg: '$metrics.mem_byte'},
                    avg_emit_event: {$avg: '$metrics.emit_event'},
                    //total_errors: {$sum: '$errors'},
                    avg_invoke_time: {$avg: {$divide: ['$metrics.invoke_time_nsecs', 1000]}},
                    total_invocations: {$sum: 1},
                    total_subinvocations: {$sum: '$calls'},
                    avg_nonrefundable_fee: {$avg: '$metrics.fee.nonrefundable'},
                    avg_refundable_fee: {$avg: '$metrics.fee.refundable'},
                    avg_rent_fee: {$avg: '$metrics.fee.rent'}
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]).toArray()
    return stats.map(({_id, ...entry}) => {
        entry.ts = _id * day
        entry.avg_read_entry = round(entry.avg_read_entry, 1)
        entry.avg_write_entry = round(entry.avg_write_entry, 1)
        entry.avg_ledger_read_byte = round(entry.avg_ledger_read_byte, 0)
        entry.avg_ledger_write_byte = round(entry.avg_ledger_read_byte, 0)
        entry.avg_mem_byte = round(entry.avg_mem_byte, 0)
        entry.avg_emit_event = round(entry.avg_emit_event, 1)
        entry.avg_invoke_time = round(entry.avg_invoke_time, 0)
        entry.avg_nonrefundable_fee = round(entry.avg_nonrefundable_fee, 0)
        entry.avg_refundable_fee = round(entry.avg_refundable_fee, 0)
        entry.avg_rent_fee = round(entry.avg_rent_fee, 0)
        return entry
    })
}

function buildInvocationFilters(contract, since, func){
    const filter = [{term: {contract}}]

    if (since) {
        since = parseInt(since, 10)
        if (!isNaN(since) && since > 1706750000) {//no contract calls before 01 feb 2024
            if (since > unixNow())
                return null //no need to search
            filter.push({range: {gte: since}})
        }
    }
    if (typeof func === 'string' && func.length < 100) {
        filter.push({term: {function: func}})
    }
    return filter
}

module.exports = {queryContractTopUsers, queryContractInvocationStats}