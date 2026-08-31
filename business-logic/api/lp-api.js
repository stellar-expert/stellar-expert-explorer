import {useExplorerApi} from '@stellar-expert/ui-framework'

/**
 * Fetch pool history records
 * @param {String} id - Pool identifier
 * @return {ExplorerApiResult}
 */
export function usePoolHistory(id) {
    return useExplorerApi(`liquidity-pool/${id.toString()}/stats-history?limit=200`, {
        processResult(history) {
            if (history.error) {
                if (history.status === 404) {
                    history.invalidPool = true
                }
                return history
            }
            return history._embedded.records
        }
    })
}