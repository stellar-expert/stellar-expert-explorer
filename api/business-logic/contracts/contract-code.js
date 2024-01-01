const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const errors = require('../errors')

async function queryContractCode(network, hash) {
    validateNetwork(network)

    const code = await db[network]
        .collection('contract_code')
        .findOne({_id: parseContractHash(hash)}, {projection: {wasm:1}})

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
    throw errors.validationError('contract_hash', 'Invalid contract hash.')
}

module.exports = {queryContractCode, parseContractHash}