import React from 'react'
import {useLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function TransactionsPerSecondView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <div className="loader"/>

    if (!(data instanceof Array))
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch transaction stats</div>
        </div>

    const dataTransactions = []
    for (const {ts, transactions} of data.slice(-30)) {
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

    return <div>
        <h3>Transactions per second</h3>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <div className="text-huge micro-space">
                        {tpsDay} tps
                    </div>
                    <div className="dimmed nano-space">
                        in the last day
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <div className="text-huge micro-space">
                        {tpsWeek} tps
                    </div>
                    <div className="dimmed nano-space">
                        in the week
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <div className="text-huge micro-space">
                        {tpsMonth} tps
                    </div>
                    <div className="dimmed nano-space">
                        in the last 30 days
                    </div>
                </div>
            </div>
        </div>
    </div>
})