const {StrKey} = require('@stellar/stellar-sdk')
const {networks} = require('../app.config')
const AssetDescriptor = require('./asset/asset-descriptor')
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
                return new AssetDescriptor(asset).toFQAN()
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

function validateAccountOrContractAddress(address) {
    if (!isValidAccountAddress(address) && !isValidContractAddress(address))
        throw errors.validationError('address', 'Invalid address.')
    return address
}

function validateTimestamp(ts) {
    try {
        ts = parseInt(ts, 10)
        if (isNaN(ts) || ts < 0 || ts >= 4294967296)
            return undefined
        return ts
    } catch (e) {
        return undefined
    }
}

function validateOfferId(offerId, paramName = 'offerId') {
    let parsed
    try {
        parsed = BigInt(offerId)
    } catch (e) {
        throw errors.validationError(paramName, 'Invalid offer id.')
    }
    if (parsed < 0n)
        throw errors.validationError(paramName, 'Negative offer id.')
    return parsed
}

function validateClaimableBalanceId(cbId) {
    if (/^[0-9a-f]{64}$/.test(cbId)) //convert from legacy format to B-address
        return StrKey.encodeLiquidityPool(Buffer.from(cbId, 'hex'))
    if (!StrKey.isValidClaimableBalance(cbId))
        throw errors.validationError('cbid', 'Invalid claimable balance id.')
    return cbId
}

function validatePoolId(poolId) {
    if (/^[0-9a-f]{64}$/.test(poolId)) //convert from legacy format to L-address
        return StrKey.encodeLiquidityPool(Buffer.from(poolId, 'hex'))
    if (!StrKey.isValidLiquidityPool(poolId))
        throw errors.validationError('poolId', 'Invalid pool id.')
    return poolId
}

function isValidPoolId(poolId) {
    return /^[0-9a-f]{64}$/.test(poolId) ||
        (/^L[A-Z0-9]{55}$/.test(poolId) && StrKey.isValidLiquidityPool(poolId))
}

module.exports = {
    validateNetwork,
    validateAssetName,
    validateAccountOrContractAddress,
    validateAccountAddress,
    validateContractAddress,
    validateClaimableBalanceId,
    validateOfferId,
    validatePoolId,
    validateTimestamp,
    isValidAccountAddress,
    isValidContractAddress,
    isValidPoolId
}