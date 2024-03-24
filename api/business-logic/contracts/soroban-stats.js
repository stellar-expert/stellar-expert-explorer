const config = require('../../app.config.json')
const db = require('../../connectors/mongodb-connector')
const elastic = require('../../connectors/elastic-connector')
const {validateNetwork} = require('../validators')

const day = 86400

function queryGeneralSorobanStats(network) {
    validateNetwork(network)
    const pipeline = [{
        $group: {
            _id: null,
            wasm: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 1, 0]}},
            sac: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 0, 1]}},
            payments: {$sum: '$payments'}
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
        fetchContractInvocationStats(network),
        fetchContractCreationHistory(network),
        fetchContractCodeCreationHistory(network)
    ])
    const merged = new Map()
    for (const result of results) {
        for (const record of result) {
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

async function fetchContractInvocationStats(network) {
    const queryRequest = {
        index: config.networks[network].opIndex,
        _source: false,
        size: 0,
        timeout: '5s',
        query: {
            term: {type: 24} //fetch only contract invocation
        },
        aggs: {
            invocations: {
                histogram: {
                    field: 'ts',
                    interval: day //day
                }
            }
        }
    }
    const res = await elastic.search(queryRequest)
    return res.aggregations.invocations.buckets.map(bucket => ({
        ts: bucket.key,
        invocations: bucket.doc_count
    }))
}

function fetchContractCreationHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$created', day]}},
                created: {$sum: 1}
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ]
    return db[network].collection('contracts').aggregate(pipeline)
        .toArray()
        .then(res => res.map(entry => ({
            ts: entry._id * day,
            newContractsCreated: entry.created
        })))
}

function fetchContractCodeCreationHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$created', day]}},
                created: {$sum: 1}
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ]
    return db[network].collection('contract_code').aggregate(pipeline)
        .toArray()
        .then(res => res.map(entry => ({
            ts: entry._id * day,
            newWasmUploaded: entry.created
        })))
}

module.exports = {queryGeneralSorobanStats, querySorobanInteractionHistory}