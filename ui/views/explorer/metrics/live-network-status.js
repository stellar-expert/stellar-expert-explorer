import React, {useCallback, useEffect, useState} from 'react'
import {retrieveLedgerInfo} from '@stellar-expert/ui-framework'
import {apiCall} from '../../../models/api'
import ActivityStreamView from '../operation/activity-stream-view'
import LastLedgerView from './last-ledger-view'
import LedgerHistoryView from './ledger-history-view'
import Last10LedgersView from './last-10-ledgers-view'
import TransactionsPerSecondView from './transactions-per-second-view'
import FeeStatsView from './fee-stats-view'
import OperationsHistoryView from './operations-history-view'
import NetworkIncidentsView from './network-incidents-view'

export default function LiveNetworkStatus({}) {
    const [last10Ledgers, setLast10Ledgers] = useState([])

    useEffect(() => {
        apiCall('ledger/lastn?limit=10')
            .then((res = []) => {
                const ledgersInfo = res.map((ledger) => {
                    const ledgerInfo = retrieveLedgerInfo(ledger)
                    return {
                        ...ledgerInfo,
                        fees: ledger.fees
                    }

                })
                setLast10Ledgers(ledgersInfo.reverse())
            })
        return () => {setLast10Ledgers([])}
    }, [])

    const updateLastLedgerList = useCallback(lastLedger => setLast10Ledgers(prev => {
        const ledgerList = prev[0]?.sequence !== lastLedger.sequence ? [lastLedger, ...prev] : prev
        setLast10Ledgers(ledgerList.splice(0, 10))
    }), [])

    return <div className="container narrow">
        <h2>Live Network Status</h2>
        <LastLedgerView onUpdate={updateLastLedgerList}/>
        <div className="space"/>
        <LedgerHistoryView/>
        <div className="space"/>
        <Last10LedgersView lastLedgers={last10Ledgers}/>
        <div className="space"/>
        <OperationsHistoryView/>
        <div className="space"/>
        <ActivityStreamView title="Recent Operations: Live Network"/>
        <div className="space"/>
        <TransactionsPerSecondView/>
        <div className="space"/>
        <FeeStatsView lastLedger={last10Ledgers[0]}/>
        <div className="space"/>
        <NetworkIncidentsView/>
    </div>
}