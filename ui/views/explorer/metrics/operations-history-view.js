import React from 'react'
import {useLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function OperationsHistoryView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        series: []
    }

    const groupedData = data.reduce((acc, cur) => {
        const {ts, operations} = cur
        //get start month timestamp
        const date = new Date(ts * 1000)
        date.setUTCDate(1)
        date.setUTCHours(0, 0, 0, 0)
        const monthStart = date.getTime()
        //group by start month timestamp
        if (!acc[monthStart]) {
            acc[monthStart] = 0
        }
        acc[monthStart] += operations

        return acc
    }, {})
    const dataOperations = Object.keys(groupedData).map(dt => [Number(dt), groupedData[dt]])

    config.series.push({
        type: 'column',
        name: 'Processed operations',
        data: dataOperations,
    })
    return <Chart type="StockChart" options={config} range title="Activity"/>
})