const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const errors = require('../errors')

/**
 * @param {String} network
 * @param {Buffer} hash
 * @param {Boolean} includeWasm
 * @return {Promise<{}>}
 */
async function fetchContractCode(network, hash, includeWasm = false) {
    let projection = {_id: 0, creator: 0}
    if (!includeWasm) {
        projection.wasm = 0
    }
    const res = await db[network]
        .collection('contract_code')
        .findOne({_id: hash}, {projection})
    if (!res)
        return null

    return {hash, ...res}
}

async function queryContractCode(network, hash) {
    validateNetwork(network)

    const code = await fetchContractCode(network, parseContractHash(hash), true)
    if (!code)
        throw errors.notFound('Contract code was not found on the ledger. Check if you specified contract hash correctly.')

    return code
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