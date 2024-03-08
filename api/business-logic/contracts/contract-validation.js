const crypto = require('crypto')
const db = require('../../connectors/mongodb-connector')
const {sorobanexpCredentials} = require('../../app.config')
const {validateTurnstileToken} = require('../../utils/turnstile-adapter')
const {unixNow, timeUnits} = require('../../utils/date-utils')
const {validateNetwork, validateContractAddress} = require('../validators')
const errors = require('../errors')
const {parseContractHash} = require('./contract-code')

let authInfo

const externalEndpoints = {
    testnet: 'https://testopenapi.sorobanexp.com/api/verifycontract',
    public: 'https://openapi.sorobanexp.com/api/verifycontract'
}

/**
 * @param {String} network
 * @param {Request} req
 * @return {Promise<{contract: String, source: String, hash: String, status: String, ts: Number}>}
 */
async function validateContract(network, req) {
    const {body, hostname} = req
    const {contract, source, antiBotToken} = body
    //validate input
    validateSourceLink(source)
    validateNetwork(network)
    validateContractAddress(contract)
    await validateTurnstileToken(antiBotToken)

    //get the contract from DB
    const contractInfo = await db[network]
        .collection('contracts')
        .findOne({address: contract}, {projection: {wasm: 1}})
    if (!contractInfo)
        throw errors.notFound('Contract was not found on the ledger. Check if you specified contract address correctly.')
    if (!contractInfo.wasm)
        throw errors.badRequest(`${contract} is not a WASM-based contract.`)

    const code = await fetchCodeValidationDetails(network, contractInfo.wasm.buffer)
    //check if the validation has been done already
    if (code.source)
        throw errors.badRequest(`Contract ${contract} source code has been already associated with the repository "${code.source}".`)
    //check if the validation is in progress
    if (code.validation && isValidationPending(code.validation))
        throw errors.badRequest(`Validation for the contract ${contract} has been already initialized.`)
    //generate unique token for callback request verification
    const uid = crypto.randomBytes(32).toString('hex')
    //prepare params for the external validation request
    const callback = `https://api.stellar.expert/explorer/${network}/contract-validation/confirm/${uid}`
    const externalRequestParams = {
        contractId: contract,
        source,
        callback
    }
    //execute external validation request
    const externalResponse = await apiRequest(externalEndpoints[network], 'POST', externalRequestParams)
    if (externalResponse.statusCode !== 200)
        throw errors.badRequest('Failed to validate contract source code')
    //store validation info in the db
    const validation = {
        status: 'pending',
        source,
        uid,
        ts: unixNow()
    }
    await db[network]
        .collection('contract_code')
        .updateOne({_id: code._id}, {$set: {validation}})
    //prepare response
    return {
        status: 'pending',
        contract,
        hash: code._id.toString('hex'),
        source,
        ts: validation.ts
    }
}

async function validateContractCallback(network, callbackParams, uid) {
    const {verifyStatus, processStatus, gitUrl, runtime, platform, networkWasmHash} = callbackParams || {}
    if (processStatus !== 'C' && processStatus !== 'F')
        return {ok: 1}
    const hash = parseContractHash(networkWasmHash)
    const code = await db[network]
        .collection('contract_code')
        .findOne({_id: hash}, {projection: {validation: 1, source: 1, _id: 0}})
    if (!code)
        throw errors.badRequest(`Contract code for WASM hash ${networkWasmHash} not found.`)
    if (!code.validation)
        throw errors.badRequest(`Validation information for the contract with WASM hash ${networkWasmHash} not found.`)
    if (code.validation.uid !== uid || !uid)
        throw errors.badRequest(`Invalid UID provided for the contract verification call with WASM hash ${networkWasmHash}.`)
    if (code.validation.source !== gitUrl)
        throw errors.badRequest(`Source code URL doesn't match URL stored in the previous verification request.`)

    if (verifyStatus === 'T') { //confirmed
        await db[network]
            .collection('contract_code')
            .updateOne({_id: hash}, {
                $set: {source: gitUrl, sourceUpdated: unixNow()},
                $unset: {validation: 1}
            })
    } else { //validation failed
        await db[network]
            .collection('contract_code')
            .updateOne({_id: hash}, {
                $set: {'validation.status': 'failed'}
            })
    }
    return {ok: 1}
}

async function getValidationStatus(network, hash) {
    const {validation, source, sourceUpdated} = await fetchCodeValidationDetails(network, hash)
    if (source)
        return {
            status: 'verified',
            source,
            ts: sourceUpdated
        }
    //check if the validation is in progress
    if (!validation || (validation.ts + 4 * timeUnits.hour / 1000 < unixNow())) //skip stale validation request details
        return {status: 'unverified'}

    return {
        status: validation.status,
        possibleSource: validation.source,
        ts: validation.ts
    }
}

async function fetchCodeValidationDetails(network, hash) {
    return await db[network]
        .collection('contract_code')
        .findOne({_id: hash}, {projection: {validation: 1, source: 1, sourceUpdated: 1}})
}

function validateSourceLink(source) {
    if (!source)
        throw errors.validationError('source', 'Source code URL is missing.')
    if (source.length > 300)
        throw errors.validationError('source', 'Source code URL is too long.')
    if (!source.startsWith('https://github.com/'))
        throw errors.validationError('source', 'Only Github repositories are supported at the moment.')
    if (!/\/tree\/[a-f0-9]{40}\//.test(source))
        throw errors.validationError('source', 'Repository link should contain the commit hash to associate the contract WASM with the particular point-in-time snapshot of the source code.')
    return source
}

function isCacheExpired(cachedInfo) {
    return !cachedInfo || cachedInfo.updated < (new Date().getTime() - 10 * 60 * 60 * 1000) //max 12hr token lifetime
}

function isValidationPending(validation) {
    //allow up to 10 minutes for the validation to conclude
    return validation.status === 'pending' || validation.ts + 10 * timeUnits.minute / 1000 < unixNow()
}

/**
 * @param {String} url
 * @param {'GET'|'POST'} method
 * @param {{}} [data]
 * @param {Boolean} [skipAuth]
 * @return {Promise<{}>}
 */
async function apiRequest(url, method, data, skipAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    }
    if (!skipAuth) {
        const token = await getAuthToken()
        headers.Authorization = 'Bearer ' + token
    }
    const requestParams = {
        method,
        cache: 'no-cache',
        headers
    }
    if (data) {
        requestParams.body = JSON.stringify(data)
    }
    const response = await fetch(url, requestParams)
    const res = await response.json()
    return res
}

async function getAuthToken() {
    if (isCacheExpired(authInfo)) {
        const result = await apiRequest('https://openapi.sorobanexp.com/api/login', 'POST', {
            email: sorobanexpCredentials.email,
            password: sorobanexpCredentials.password
        }, true)
        if (result.statusCode !== 200 || !result.token)
            throw new Error('Failed to authenticate with openapi.sorobanexp.com')
        authInfo = {
            token: result.token,
            updated: new Date()
        }
    }
    return authInfo.token
}


module.exports = {validateContract, validateContractCallback, getValidationStatus}