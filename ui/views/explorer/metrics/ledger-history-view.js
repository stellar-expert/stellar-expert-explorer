import React from 'react'
import {Amount} from '@stellar-expert/ui-framework'
import {useLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'
import LedgerHistoryFailedTransactionsChartView from '../ledger/charts/ledger-history-failed-transactions-chart-view'

const limit = 30 //30 days

export default Chart.withErrorBoundary(function LedgerHistoryView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>

    const totalAmount = {
        successTx: 0,
        failedTx: 0,
        successOp: 0,
        failedOp: 0,
        closedTime: 0
    }
    const calculationData = data.slice(-1 - limit, -1) //last full 30 days
    for (const {transactions, failed_transactions, operations, failed_operations, avg_ledger_time} of calculationData) {
        totalAmount.failedTx += failed_transactions
        totalAmount.successTx += transactions
        totalAmount.failedOp += failed_operations
        totalAmount.successOp += operations
        totalAmount.closedTime += avg_ledger_time
    }

    return <div>
        <LedgerHistoryFailedTransactionsChartView/>
        <div className="space"/>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Transactions</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.successTx, limit)} <span className="text-tiny dimmed">success</span>&nbsp;/&nbsp;
                        {avgValue(totalAmount.failedTx, limit)} <span className="text-tiny dimmed">failed</span>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Operations</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.successOp, limit)} <span className="text-tiny dimmed">success</span>&nbsp;/&nbsp;
                        {avgValue(totalAmount.failedOp, limit)} <span className="text-tiny dimmed">failed</span>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Ledger Closing Time</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.closedTime, limit, 1)}s
                    </div>
                </div>
            </div>
        </div>
    </div>
})

function avgValue(val, amount, digits = 0) {
    return <Amount amount={parseFloat(val / amount).toFixed(digits)}/>
}