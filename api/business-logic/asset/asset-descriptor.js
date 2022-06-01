const {StrKey} = require('stellar-sdk')

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

const nativeAssetType = 'XLM'

/**
 * Stellar Asset definition.
 */
class Asset {
    /**
     * Creates an instance of the Asset
     * @param codeOrFullyQualifiedName {String} - Asset code or fully qualified asset name in CODE-ISSUER-TYPE format.
     * @param type [String] - Asset type. One of ['credit_alphanum4', 'credit_alphanum12', 'native'].
     * @param issuer [String] - Asset issuer account public key.
     */
    constructor(codeOrFullyQualifiedName, type, issuer) {
        if (codeOrFullyQualifiedName instanceof Asset) {
            //clone Asset
            ['code', 'type', 'issuer'].forEach(field => this[field] = codeOrFullyQualifiedName[field])
            return
        }
        if (issuer !== undefined) {
            this.code = codeOrFullyQualifiedName
            this.type = normalizeType(codeOrFullyQualifiedName, type)
            this.issuer = issuer
        } else if (codeOrFullyQualifiedName === nativeAssetType || type === nativeAssetType || (codeOrFullyQualifiedName === 'XLM' && !type)) {
            this.type = nativeAssetType
        }
        else {
            if (!codeOrFullyQualifiedName || typeof codeOrFullyQualifiedName !== 'string' || codeOrFullyQualifiedName.length < 3 || codeOrFullyQualifiedName.indexOf('-') < 0)
                throw new TypeError(`Invalid asset name: ${codeOrFullyQualifiedName}. Use CODE-ISSUER format.`)
            const parts = codeOrFullyQualifiedName.split('-')
            this.code = parts[0]
            this.issuer = parts[1]
            this.type = normalizeType(this.code, parts[2])
        }
        if (this.type !== nativeAssetType && !StrKey.isValidEd25519PublicKey(this.issuer)) throw new Error('Invalid asset issuer address: ' + this.issuer)
        //if (!this.code || !/^[a-zA-Z0-9]{1,12}$/.test(this.code)) throw new Error(`Invalid asset code. See https://www.stellar.org/developers/guides/concepts/assets.html#alphanumeric-4-character-maximum`)
    }

    get isNative() {
        return this.type === nativeAssetType
    }

    equals(anotherAsset) {
        if (!anotherAsset) return false
        return this.toString() === anotherAsset.toString()
    }

    /**
     * Returns Asset name in a CODE-ISSUER format (compatible with StellarSDK).
     * @returns {String}
     */
    toString() {
        if (this.isNative) return nativeAssetType
        return `${this.code}-${this.issuer}`
    }

    /**
     * Returns a fully-qualified Asset unique name in a CODE-ISSUER-TYPE format.
     * @returns {String}
     */
    toFQAN() {
        if (this.isNative) return nativeAssetType
        return `${this.code}-${this.issuer}-${this.type}`
    }

    /**
     * Formats Asset as a currency with optional maximum length.
     * @param issuerMaxLength {Number}
     * @returns {String}
     */
    toCurrency(issuerMaxLength) {
        if (this.isNative) return 'XLM'
        if (issuerMaxLength) {
            let issuerAllowedLength = issuerMaxLength - 1,
                shortenedIssuer = this.issuer.substring(0, issuerAllowedLength / 2) + '…' + this.issuer.substr(-issuerAllowedLength / 2)

            return `${this.code}-${shortenedIssuer}`
        }
        return this.code
    }

    toJSON() {
        return this.toString()
    }

    /**
     * Native asset type.
     * @returns {Asset}
     */
    static get native() {
        return new Asset(nativeAssetType)
    }

    /**
     * Parses asset from Horizon API response
     * @param obj {Object} - Object to parse data from.
     * @param prefix {String} - Optional field names prefix.
     * @returns {Asset}
     */
    static parseAssetFromObject(obj, prefix = '') {
        let type = obj[prefix + 'asset_type']
        if (!type) throw new TypeError(`Invalid asset descriptor: ${JSON.stringify(obj)}. Prefix: ${prefix}`)
        if (type === 'native') return Asset.native
        return new Asset(obj[prefix + 'asset_code'], obj[prefix + 'asset_type'], obj[prefix + 'asset_issuer'])
    }
}

module.exports = Asset