import React from 'react'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerHistoryOperationsLedgerTimeChartView({className, noTitle}) {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        yAxis: [{
            title: {
                text: 'Avg Ledger Closing Time'
            },
            opposite: false
        }, {
            title: {
                text: 'Processed Operations'
            },
            opposite: true
        }],
        series: []
    }
    const dataLedgerTime = []
    const dataOperations = []
    for (const {ts, avg_ledger_time, operations} of data) {
        const dt = ts * 1000
        dataLedgerTime.push([dt, avg_ledger_time])
        dataOperations.push([dt, operations])
    }

    config.series.push({
        type: 'area',
        name: 'Avg Ledger Closing Time',
        tooltip: {
            valueSuffix: 's',
            valueDecimals: 1
        },
        data: dataLedgerTime
    })
    config.series.push({
        type: 'column',
        name: 'Processed Operations',
        yAxis: 1,
        data: dataOperations,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    return <Chart type="StockChart" options={config} className={className} grouped range title={noTitle ? null : <>
        Ledger Performance
        <EmbedWidgetTrigger path="network-activity/performance" title="Stellar Network Stats - Ledger Performance"/>
    </>}/>
})
