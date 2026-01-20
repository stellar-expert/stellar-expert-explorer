import React from 'react'
import {useLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function TransactionsPerSecondView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        yAxis: [{
            title: {
                text: ''
            },
            opposite: false
        }],
        rangeSelector: {
            selected: 0
        },
        series: []
    }
    const dataTransactions = []
    for (const {ts, transactions} of data) {
        const dt = ts * 1000
        const tps = Number((transactions / 86400).toFixed(2))
        dataTransactions.push([dt, tps])
    }
    const now = new Date().getTime()
    const todayStat = dataTransactions.pop()
    const spentTime = now - todayStat[0]
    const tpsDay = (todayStat[1] * 86400 * 1000 / spentTime).toFixed(2)
    dataTransactions.push([todayStat[0], Number(tpsDay)]) //correct stat data for today
    const tpsWeek = (dataTransactions.slice(-7).reduce((a, tps) => a += tps[1], 0) / 7).toFixed(2)
    const tpsMonth = (dataTransactions.slice(-30).reduce((a, tps) => a += tps[1], 0) / 30).toFixed(2)

    config.series.push({
        type: 'column',
        name: 'Average TPS by day',
        data: dataTransactions,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    return <div className="row">
        <div className="column column-33">
            <div className="segment blank">
                <h3>Current TPS</h3>
                <hr className="flare"/>
                <div className="text-huge space">
                    {tpsDay} tps
                </div>
                <div className="dimmed nano-space">
                    in the last day
                </div>
                <div className="text-huge space">
                    {tpsWeek} tps
                </div>
                <div className="dimmed nano-space">
                    in the last week
                </div>
                <div className="text-huge space">
                    {tpsMonth} tps
                </div>
                <div className="dimmed nano-space">
                    in the last 30 days
                </div>
            </div>
        </div>
        <div className="column column-66">
            <div className="space mobile-only"/>
            <Chart type="StockChart" options={config} grouped range title="Transactions per second"/>
        </div>
    </div>
})