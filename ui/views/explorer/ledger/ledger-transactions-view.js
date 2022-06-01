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

    if (!transactions) return <div className="loading"/>
    return <div className="ledger-transactions-view">
        <h3>Ledger Transactions</h3>
        <div className="block-indent-screen">
            {transactions.map(tx => <div className="space" key={tx.id}>
                    <TxDetails tx={tx} embedded/>
                </div>
            )}
        </div>
    </div>
}

LedgerTransactionsView.propTypes = {
    ledgerSequence: PropTypes.number.isRequired
}