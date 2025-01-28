import {StrKey} from '@stellar/stellar-base'
import {parseStellarGenericId} from '@stellar-expert/ui-framework'

const searchTypeMap = {
    account: 'account',
    text: 'text',
    federation: 'federation address',
    transaction: 'transaction',
    operation: 'operation',
    ledger: 'ledger'
}

/**
 * Determine appropriate query type for the autolookup.
 * @param {string} query - Raw query.
 * @return {Array<('account'|'asset'|'contract'|'tx'|'ledger'|'text'|'federation'|'sorobandomains')>}
 */
function detectSearchType(query) {
    const res = []
    if (query) {
        if (['xlm', 'native', 'lumen'].includes(query.toLowerCase())) return ['asset']
        //account
        if (StrKey.isValidMed25519PublicKey(query)) return ['account']
        if (StrKey.isValidEd25519PublicKey(query)) return ['account', 'asset']
        //contract address
        if (StrKey.isValidContract(query)) return ['contract', 'asset']
        //tx hash
        if (query.length === 64 && /^[a-f0-9]{64}$/.test(query)) return ['transaction']
        //federation address
        if (/^([a-z0-9-+]+)\.xlm$/i.test(query)) return ['sorobandomains']
        if (/^(.+)\*([^.]+\..+)$/.test(query)) return ['federation']
        //ledger, offer, tx/op generic id
        if (/^\d{1,19}$/.test(query)) {
            if (query.length <= 10) {
                res.push('ledger')
            }
            res.push('offer')
            if (query.length > 10 && query.length < 20) {
                const {type} = parseStellarGenericId(query)
                if (type === 'transaction') res.push('transaction')
                if (type === 'operation') res.push('operation')
                //it's definitely not an asset code
                if (query.length > 12) return res
            }
        }
        //full-text search for assets and accounts
        res.push('account')
        res.push('asset')
    }
    return res
}

export {detectSearchType, searchTypeMap}