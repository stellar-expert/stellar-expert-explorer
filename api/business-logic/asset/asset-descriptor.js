const {StrKey, Asset} = require('@stellar/stellar-sdk')
const {isValidContractAddress} = require('../validators')

function normalizeType(code, type) {
    switch (type) {
        case 'credit_alphanum4':
            return 1
        case 'credit_alphanum12':
            return 2
        default: //autodetect type
            return code.length > 4 ? 2 : 1
    }
}

const nativeAssetName = 'XLM'

/**
 * Stellar Asset definition.
 */
class AssetDescriptor {
    /**
     * Creates an instance of the Asset
     * @param {String|AssetDescriptor} codeOrFullyQualifiedName - Asset code or fully qualified asset name in CODE-ISSUER-TYPE format.
     * @param {String} [type] - Asset type. One of ['credit_alphanum4', 'credit_alphanum12', 'native'].
     * @param {String} [issuer] - Asset issuer account public key.
     */
    constructor(codeOrFullyQualifiedName, type, issuer) {
        if (codeOrFullyQualifiedName instanceof AssetDescriptor) {
            //clone Asset
            ['code', 'type', 'issuer'].forEach(field => this[field] = codeOrFullyQualifiedName[field])
            return
        }
        if (issuer !== undefined) {
            this.code = codeOrFullyQualifiedName
            this.type = normalizeType(codeOrFullyQualifiedName, type)
            this.issuer = issuer
        } else if (codeOrFullyQualifiedName === nativeAssetName || type === 'native' || (codeOrFullyQualifiedName === 'XLM' && !type)) {
            this.type = 0
        } else if (isValidContractAddress(codeOrFullyQualifiedName)) {
            this.type = 4
            this.contract = codeOrFullyQualifiedName
            return
        } else {
            if (!codeOrFullyQualifiedName || typeof codeOrFullyQualifiedName !== 'string' || codeOrFullyQualifiedName.length < 3 || codeOrFullyQualifiedName.indexOf('-') < 0)
                throw new TypeError(`Invalid asset name: ${codeOrFullyQualifiedName}. Use CODE-ISSUER format or contract address.`)
            const parts = codeOrFullyQualifiedName.split('-')
            this.code = parts[0]
            this.issuer = parts[1]
            this.type = normalizeType(this.code, parts[2])
        }
        if (this.type !== 0 && !StrKey.isValidEd25519PublicKey(this.issuer))
            throw new Error('Invalid asset issuer address: ' + this.issuer)
        //if (!this.code || !/^[a-zA-Z0-9]{1,12}$/.test(this.code)) throw new Error(`Invalid asset code. See https://www.stellar.org/developers/guides/concepts/assets.html#alphanumeric-4-character-maximum`)
    }

    get isNative() {
        return this.type === 0
    }

    get isContract() {
        return this.type === 4
    }

    equals(anotherAsset) {
        if (!anotherAsset)
            return false
        return this.toString() === anotherAsset.toString()
    }

    /**
     * Returns Asset name in a CODE-ISSUER format (compatible with StellarSDK).
     * @returns {String}
     */
    toString() {
        if (this.isNative)
            return nativeAssetName
        return this.contract || `${this.code}-${this.issuer}`
    }

    /**
     * Returns a fully-qualified Asset unique name in a CODE-ISSUER-TYPE format.
     * @returns {String}
     */
    toFQAN() {
        if (this.isNative)
            return nativeAssetName
        return this.contract || `${this.code}-${this.issuer}-${this.type}`
    }

    /**
     * Formats Asset as a currency with optional maximum length.
     * @param {Number} [issuerMaxLength]
     * @returns {String}
     */
    toCurrency(issuerMaxLength) {
        if (this.isNative)
            return nativeAssetName
        if (this.contract)
            return this.contract
        if (issuerMaxLength) {
            const issuerAllowedLength = issuerMaxLength - 1
            const shortenedIssuer = this.issuer.substring(0, issuerAllowedLength / 2) + '…' + this.issuer.substr(-issuerAllowedLength / 2)

            return `${this.code}-${shortenedIssuer}`
        }
        return this.code
    }

    toJSON() {
        return this.toString()
    }

    /**
     * @return {Asset}
     */
    toStellarAsset() {
        if (this.type === 4)
            throw new TypeError('Cannot convert contract to Stellar asset')
        if (this.isNative)
            return Asset.native()
        return new Asset(this.code, this.issuer)
    }

    /**
     * Native asset type.
     * @returns {AssetDescriptor}
     */
    static get native() {
        return new AssetDescriptor(nativeAssetName)
    }

    /**
     * Parses asset from Horizon API response
     * @param {Object} obj - Object to parse data from.
     * @param {String} prefix - Optional field names prefix.
     * @returns {AssetDescriptor}
     */
    static parseAssetFromObject(obj, prefix = '') {
        const type = obj[prefix + 'asset_type']
        if (!type)
            throw new TypeError(`Invalid asset descriptor: ${JSON.stringify(obj)}. Prefix: ${prefix}`)
        if (type === 'native')
            return AssetDescriptor.native
        return new AssetDescriptor(obj[prefix + 'asset_code'], obj[prefix + 'asset_type'], obj[prefix + 'asset_issuer'])
    }
}

module.exports = AssetDescriptor