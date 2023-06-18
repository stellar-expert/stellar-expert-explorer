import React from 'react'
import PropTypes from 'prop-types'
import {useDependantState, loadLedgerTransactions} from '@stellar-expert/ui-framework'
import TxDetails from '../tx/tx-details-view'

export default function LedgerTransactionsView({ledgerSequence}) {
    const [transactions, setTransactions] = useDependantState(() => {
        loadLedgerTransactions(ledgerSequence)
            .then(res => setTransactions(res))
        return null
    }, [ledgerSequence])

    if (!transactions)
        return <div className="loading"/>
    if (!transactions.length)
        return <div className="text-center space dimmed">(no transactions)</div>
    return <div className="block-indent-screen space">
        <h3>Ledger Transactions</h3>
        {transactions.map(tx => <div className="space" key={tx.id}><TxDetails tx={tx} embedded/></div>)}
    </div>
}

LedgerTransactionsView.propTypes = {
    ledgerSequence: PropTypes.number.isRequired
}