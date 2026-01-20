import React, {useState} from 'react'
import ActivityStreamView from '../operation/activity-stream-view'
import LastLedgerView from './last-ledger-view'
import LedgerHistoryView from './ledger-history-view'
import Last10LedgersView from './last-10-ledgers-view'
import TransactionsPerSecondView from './transactions-per-second-view'
import TransactionFeeInfoView from './transactions-fee-info-view'
import FeeStatsView from './fee-stats-view'
import OperationsHistoryView from './operations-history-view'
import NetworkIncidentsView from './network-incidents-view'

export default function LiveNetworkStatus({}) {
    const [lastLedger, setLastLedger] = useState()

    return <div className="container narrow">
        <h2>Live Network Status</h2>
        <LastLedgerView onUpdate={setLastLedger}/>
        <div className="space"/>
        <LedgerHistoryView/>
        <div className="space"/>
        <Last10LedgersView lastLedger={lastLedger}/>
        <div className="space"/>
        <OperationsHistoryView/>
        <div className="space"/>
        <ActivityStreamView title="Recent Operations: Live Network"/>
        <div className="space"/>
        <TransactionsPerSecondView/>
        <div className="space"/>
        <TransactionFeeInfoView lastLedger={lastLedger}/>
        <div className="space"/>
        <FeeStatsView lastLedger={lastLedger}/>
        <div className="space"/>
        <NetworkIncidentsView/>
    </div>
}