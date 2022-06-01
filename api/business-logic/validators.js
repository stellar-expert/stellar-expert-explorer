const {StrKey} = require('stellar-sdk'),
    {Long} = require('bson'),
    errors = require('./errors'),
    {networks} = require('../app.config')

function validateNetwork(networkName) {
    //TODO: move this check to registerRoute() func
    if (networks[networkName] === undefined) throw errors.validationError('network', `Unknown network name: "${networkName}".`)
    return networkName
}

function validateAssetName(asset) {
    if (typeof asset === 'string') {
        const [code, issuer, type] = asset.split('-')
        if (issuer) {
            if (StrKey.isValidEd25519PublicKey(issuer) && code.length <= 12) return asset
        } else {
            if (code === 'XLM') return asset
        }
    }
    throw errors.validationError('asset', 'Invalid asset descriptor. Use {code}-{issuer}-{type} format.')
}

function isValidAccountAddress(account) {
    return StrKey.isValidEd25519PublicKey(account)
}

function validateAccountAddress(account) {
    if (!isValidAccountAddress(account))
        throw errors.validationError('account', 'Invalid account public key.')
    return account
}

function validateOfferId(offerId) {
    try {
        const parsed = Long.fromString(offerId)
        if (parsed.isNegative())
            throw new Error('Negative offer id')
        return parsed
    } catch (e) {
        throw errors.validationError('offerId', 'Invalid offer id.')
    }
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
    isValidAccountAddress
}