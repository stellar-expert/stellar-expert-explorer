import React from 'react'
import {useLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function LedgerHistoryView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        yAxis: [{
            title: {
                text: 'Transactions'
            },
            opposite: false
        }, {
            title: {
                text: 'Operations'
            },
            opposite: true
        }],
        series: []
    }
    const dataTransactions = []
    const dataOperations = []
    const totalAmount = {
        successTx: 0,
        failedTx: 0,
        op: 0,
        closedTime: 0
    }
    for (const {ts, transactions, failed_transactions, avg_ledger_time, operations} of data) {
        const dt = ts * 1000
        dataTransactions.push([dt, transactions])
        dataOperations.push([dt, operations])
        totalAmount.failedTx += failed_transactions
        totalAmount.successTx += transactions - failed_transactions
        totalAmount.op += operations
        totalAmount.closedTime += avg_ledger_time
    }

    config.series.push({
        type: 'column',
        name: 'Transactions',
        data: dataTransactions,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    config.series.push({
        type: 'column',
        name: 'Operations',
        yAxis: 1,
        data: dataOperations,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    return <div>
        <Chart type="StockChart" options={config} grouped range title="Ledger Info"/>
        <div className="space"/>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Transactions</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.successTx, data.length)} <span className="text-tiny dimmed">success</span>&nbsp;/&nbsp;
                        {avgValue(totalAmount.failedTx, data.length)} <span className="text-tiny dimmed">failed</span>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Operations</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.op, data.length)}
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Ledger Closing Time</h3>
                    <div className="text-huge double-space">
                        {avgValue(totalAmount.closedTime, data.length, 1)}s
                    </div>
                </div>
            </div>
        </div>
    </div>
})

function avgValue(val, amount, digits = 0) {
    return parseFloat(val / amount).toFixed(digits)
}