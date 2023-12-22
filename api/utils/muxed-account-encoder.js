const {StrKey} = require('@stellar/stellar-sdk')

/**
 *
 * @param {String} baseAddress
 * @param {ObjectId} accountAndMuxedId
 * @return {String}
 */
function encodeOperationMuxedAccount(baseAddress, accountAndMuxedId) {
    if (!accountAndMuxedId) return baseAddress
    const base = StrKey.decodeEd25519PublicKey(baseAddress),
        muxedId = accountAndMuxedId.id.slice(4, 12),
        combined = Buffer.concat([base, muxedId], 40)
    return StrKey.encodeMed25519PublicKey(combined)
}

module.exports = {encodeOperationMuxedAccount}