const {StrKey} = require('@stellar/stellar-sdk')
const {Long} = require('bson')
const {networks} = require('../app.config')
const errors = require('./errors')

function validateNetwork(networkName) {
    //TODO: move this check to registerRoute() func
    if (networks[networkName] === undefined)
        throw errors.validationError('network', `Unknown network name: "${networkName}".`)
    return networkName
}

function validateAssetName(asset) {
    if (typeof asset === 'string') {
        if (isValidContractAddress(asset))
            return asset
        const [code, issuer, type] = asset.split('-')
        if (issuer) {
            if (StrKey.isValidEd25519PublicKey(issuer) && code.length <= 12)
                return asset
        } else {
            if (code === 'XLM')
                return asset
        }
    }
    throw errors.validationError('asset', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format or contract address.')
}

function isValidAccountAddress(account) {
    return StrKey.isValidEd25519PublicKey(account)
}

function validateAccountAddress(account) {
    if (!StrKey.isValidEd25519PublicKey(account))
        throw errors.validationError('account', 'Invalid account public key.')
    return account
}

function isValidContractAddress(contract) {
    return StrKey.isValidContract(contract)
}

function validateContractAddress(contract) {
    if (!isValidContractAddress(contract))
        throw errors.validationError('contract', 'Invalid contract address.')
    return contract
}

function validateOfferId(offerId, paramName = 'offerId') {
    let parsed
    try {
        parsed = Long.fromString(offerId)
    } catch (e) {
        throw errors.validationError(paramName, 'Invalid offer id.')
    }
    if (parsed.isNegative())
        throw errors.validationError(paramName, 'Negative offer id.')
    return parsed
}

function validatePoolId(poolId) {
    if (!/^[0-9a-f]{64}$/.test(poolId))
        throw errors.validationError('poolId', 'Invalid pool id.')
    return poolId
}

module.exports = {
    validateNetwork,
    validateAssetName,
    validateAccountAddress,
    validateOfferId,
    validatePoolId,
    isValidAccountAddress,
    validateContractAddress,
    isValidContractAddress
}