const db = require('../../connectors/mongodb-connector')
const {validateNetwork, isValidContractAddress} = require('../validators')
const errors = require('../errors')

async function queryContractCode(network, contractOrHash) {
    validateNetwork(network)
    if (isValidContractAddress(contractOrHash)) {
        const contractInfo = await db[network]
            .collection('contracts')
            .findOne({address: contractOrHash}, {projection: {wasm: 1}})
        if (!contractInfo?.wasm)
            throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')
        contractOrHash = contractInfo.wasm.toString('hex')
    }

    const code = await db[network]
        .collection('contract_code')
        .findOne({_id: parseContractHash(contractOrHash)}, {projection: {wasm: 1}})

    if (!code)
        throw errors.notFound('Contract code was not found on the ledger. Check if you specified contract hash correctly.')

    return code.wasm.buffer
}

function parseContractHash(hash) {
    if (typeof hash === 'string' && /^[0-9a-f]{64}$/i.test(hash)) {
        try {
            const parsedHash = Buffer.from(hash, 'hex')
            if (parsedHash.length === 32)
                return parsedHash
        } catch (e) {
        }
    }
    throw errors.validationError('hash', 'Invalid contract hash.')
}

module.exports = {queryContractCode, parseContractHash}