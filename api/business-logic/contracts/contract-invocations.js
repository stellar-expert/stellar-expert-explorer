const errors = require('../errors')
const db = require('../../connectors/mongodb-connector')
const {unixNow} = require('../../utils/date-utils')
const {round} = require('../../utils/formatter')
const {validateNetwork, validateContractAddress} = require('../validators')
const {AccountAddressJSONResolver} = require('../account/account-resolver')
const {resolveContractId} = require('./contract-resolver')

async function queryContractTopUsers(network, contract, func, since) {
    validateNetwork(network)
    validateContractAddress(contract)
    const contractId = await resolveContractId(network, contract)
    if (!contractId)
        throw errors.notFound(`Contract not found`)

    const filter = {contract: contractId}
    if (since) {
        since = parseInt(since, 10)
        if (!isNaN(since) && since > 1706750000) {//no contract calls before 01 feb 2024
            if (since > unixNow())
                return [] //no calls in the future
            filter.ts = {$gte: since}
        }
    }
    if (typeof func === 'string' && func.length < 100) {
        filter.function = func
    }
    let invokers = await db[network]
        .collection('invocations')
        .aggregate([
            {
                $match: filter
            },
            {
                $group: {
                    _id: '$initiator',
                    invocations: {$sum: 1}
                    //errors: {$sum: '$errors'}
                }
            },
            {
                $sort: {invocations: -1}
            },
            {
                $limit: 50
            }
        ]).toArray()
    const accountResolver = new AccountAddressJSONResolver(network)

    invokers = invokers.map(({_id, invocations}) => ({
        address: accountResolver.resolve(_id),
        invocations
    }))
    await accountResolver.fetchAll()
    return invokers
}

async function queryContractInvocationStats(network, contract, func, since) {
    validateNetwork(network)
    validateContractAddress(contract)
    const contractId = await resolveContractId(network, contract)
    if (!contractId)
        throw errors.notFound(`Contract not found`)

    const filter = {contract: contractId}
    if (since) {
        since = parseInt(since, 10)
        if (!isNaN(since) && since > 1706750000) {//no contract calls before 01 feb 2024
            if (since > unixNow())
                return [] //no calls in the future
            filter.ts = {$gte: since}
        }
    }
    if (typeof func === 'string' && func.length < 100) {
        filter.function = func
    }

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

module.exports = {queryContractTopUsers, queryContractInvocationStats}