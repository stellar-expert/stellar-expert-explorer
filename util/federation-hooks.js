import {Federation} from '@stellar/stellar-sdk'
import {useDependantState} from '@stellar-expert/ui-framework'

/**
 * Resolve federation address for account through federation server specified in stellar.toml
 * @param {String} account
 * @param {Boolean} [skipFederationErrors]
 * @returns {String}
 */
export function useResolvedFederationName(account, skipFederationErrors = true) {
    const [federationName, setFederationName] = useDependantState(() => {
        Federation.Server.resolve(account)
            .then(res => setFederationName(res.stellar_address || null))
            .catch(e => {
                if (skipFederationErrors)
                    return //ignore federation errors
                console.error(e)
            })
        return null
    }, [account])
    return federationName
}