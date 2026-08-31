import React, {useState} from 'react'
import {UtcTimestamp, useDependantState, loadLedger} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'
import SearchResultsSectionView from './search-results-section-view'

export default function LedgerSearchResultsView({term, onLoaded}) {
    const [inProgress, setInProgress] = useState(true),
        [ledger, setLedger] = useDependantState(() => {
            setInProgress(true)
            loadLedger(parseInt(term))
                .then(ledger => setLedger(ledger))
                .finally(() => {
                    setInProgress(false)
                })
        }, [term])
    if (inProgress) return null
    if (!ledger) {
        onLoaded(null)
        return null
    }
    const txCnt = []
    if (ledger.operation_count > 0) {
        txCnt.push(`${ledger.successful_transaction_count} transactions (${ledger.operation_count} operations)`)
    }
    if (ledger.failed_transaction_count > 0) {
        txCnt.push(`${ledger.failed_transaction_count} failed transactions`)
    }

    const res = {
        link: resolvePath(`ledger/${ledger.sequence}`),
        title: <>Ledger {ledger.sequence}</>,
        type: 'ledger',
        description: <>
            <UtcTimestamp date={ledger.closed_at}/>&emsp;
            {txCnt.length ? txCnt.join(', ') : 'no transactions'}
        </>
    }
    onLoaded(res)
    return <SearchResultsSectionView key="ledger" section="Ledgers" items={[res]}/>
}