import {useExplorerApi} from '@stellar-expert/ui-framework'

/**
 * Fetch domain metadata (parsed TOML info, interop services, warnings)
 * @param {String} domain - Home domain
 * @return {ExplorerApiResult} - Metadata record in data, or an empty object if no metadata has been collected for the domain
 */
export function useDomainMeta(domain) {
    return useExplorerApi(domain ? 'domain-meta?domain=' + encodeURIComponent(domain) : null, {
        processResult(res) {
            if (res.error)
                return res
            return res._embedded?.records?.[0] || {} //the cache layer doesn't accept null results
        }
    })
}
