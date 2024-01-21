const crypto = require('crypto')

/**
 * Compute SHA256 for input
 * @param {Buffer} raw
 * @param {'base64'|'hex'|'binary'} outputFormat
 * @return {String|Buffer}
 */
function computeHash(raw, outputFormat = 'hex') {
    if (outputFormat === 'binary') {
        outputFormat = undefined
    }
    return crypto.createHash('sha256').update(raw).digest(outputFormat)
}

module.exports = {computeHash}