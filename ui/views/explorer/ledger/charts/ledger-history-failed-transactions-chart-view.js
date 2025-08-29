import React from 'react'
import Chart from '../../../components/chart/chart'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerHistoryFailedTransactionsChartView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>

    //eslint-disable-next-line prefer-const
    const successfulTx = []
    const failedTx = []
    for (const {ts, transactions, failed_transactions} of data) {
        const dt = ts * 1000
        successfulTx.push([dt, transactions])
        failedTx.push([dt, failed_transactions])
    }

    const options = {
        plotOptions: {
            column: {
                stacking: 'normal'
            }
        },
        yAxis: [{
            title: {
                text: 'Transactions Processed'
            },
            opposite: false
        }],
        series: [{
            type: 'column',
            name: 'Successful Transactions',
            data: successfulTx,
            dataGrouping: {
                approximation: 'sum'
            }
        }, {
            type: 'column',
            name: 'Failed Transactions',
            data: failedTx,
            dataGrouping: {
                approximation: 'sum'
            }
        }]
    }

    return <Chart type="StockChart" title="Transactions Success Rate" options={options} grouped range/>
})