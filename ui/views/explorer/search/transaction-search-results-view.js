import React, {useState} from 'react'
import {AccountAddress, UtcTimestamp, useDependantState, loadTransaction} from '@stellar-expert/ui-framework'
import SearchResultsSectionView from './search-results-section-view'
import {resolvePath} from '../../../business-logic/path'

export default function TransactionSearchResultsView({term, onLoaded}) {
    const [inProgress, setInProgress] = useState(true),
        [tx, setTx] = useDependantState(() => {
            setInProgress(true)
            loadTransaction(term)
                .then(tx => setTx(tx))
                .finally(() => setInProgress(false))
        }, [term])
    if (inProgress) return null
    if (!tx) {
        onLoaded([])
        return null
    }
    const res = {
        link: resolvePath(`tx/${tx.id}`),
        title: <>
            Transaction {tx.hash.substr(0, 8)}&hellip;{tx.hash.substr(-8)}{' '}
            {tx.successful ? '' : <span className="details">(failed)</span>}
        </>,
        description: <>
            <UtcTimestamp date={tx.created_at} dateOnly/>{' | '}
            Source <AccountAddress account={tx.source_account} chars={12}/>,{' '}
            {tx.operation_count} operation{tx.operation_count != 1 && 's'}
        </>,
        links: <>
            <a href={resolvePath(`account/${tx.source_account}`)}>Source account</a>&emsp;
            <a href={resolvePath(`ledger/${tx.ledger_attr}`)}>Ledger</a>
        </>
    }
    onLoaded(res)
    return <SearchResultsSectionView key="transaction" section="Transactions" items={[res]}/>
}