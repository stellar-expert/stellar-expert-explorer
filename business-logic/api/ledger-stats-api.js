import {useExplorerApi} from '@stellar-expert/ui-framework'

export function useLedgerStats() {
    return useExplorerApi('ledger/ledger-stats')
}

export function use24hLedgerStats(autorefresh) {
    return useExplorerApi('ledger/ledger-stats/24h', autorefresh ? {ttl: 60} : undefined)
}