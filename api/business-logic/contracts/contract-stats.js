const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork, validateContractAddress} = require('../validators')
const AssetDescriptor = require('../asset/asset-descriptor')
const {countContractStateEntries} = require('../contract-state/contract-state-query')
const {getValidationStatus} = require('./contract-validation')
const {aggregateContractHistory} = require('./contract-aggregation')

async function queryContractStats(network, contractAddress) {
    validateNetwork(network)
    validateContractAddress(contractAddress)

    const contract = await db[network]
        .collection('contracts')
        .findOne({_id: contractAddress})
    if (!contract)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')

    const res = serializeContractStats(contract)

    const count = await countContractStateEntries(network, contract._id)
    if (count > 0) {
        res.storage_entries = count
    }
    if (contract.wasm) { //TODO: store validation in the contract itself
        res.validation = await getValidationStatus(network, contract.wasm)
    }
    const versions = await db[network].collection('contract_wasm_history').count({entry: contract._id})
    if (versions > 1) {
        res.versions = versions
    }
    /*const functions = await db[network]
        .collection('invocations')
        .aggregate([
            {
                $match: {contract: contract._id}
            },
            {
                $group: {
                    _id: '$function',
                    invocations: {$sum: 1},
                    //errors: {$sum: '$errors'},
                    subinvocations: {$sum: '$nested'}
                }
            },
            {
                $sort: {invocations: -1}
            }
        ]).toArray()

    res.functions = functions.map(({_id, ...props}) => {
        props.function = _id
        return props
    })*/
    return res
}


function serializeContractStats(contract){
    const res = {
        contract: contract._id,
        created: contract.created,
        creator: contract.creator
    }
    if (contract.wasm) {
        res.wasm = contract.wasm.toString('hex')
    }
    if (contract.issuer) {
        if (contract.code) {
            res.asset = new AssetDescriptor(contract.code + '-' + contract.issuer).toFQAN()
        } else {
            res.issuer = contract.issuer
            res.salt = contract.salt?.toString()
        }
    } else if (contract.code === 'XLM') {
        res.asset = 'XLM'
    }

    const stats = aggregateContractHistory(contract.history)
    return Object.assign(res, stats)
}

module.exports = {queryContractStats, serializeContractStats}