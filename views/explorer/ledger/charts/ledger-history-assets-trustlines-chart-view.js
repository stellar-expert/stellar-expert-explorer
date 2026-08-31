import React from 'react'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerHistoryAssetsTrustlinesChartView({className, noTitle}) {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        yAxis: [{
            title: {
                text: 'Total Trustlines'
            },
            opposite: true
        }, {
            title: {
                text: 'New Assets'
            },
            opposite: false
        }],
        series: []
    }
    const dataNewAssets = []
    const dataTrustlines = []
    const dataFundedTrustlines = []
    for (const {ts, trustlines, funded_trustlines, new_assets} of data) {
        const dt = ts * 1000
        dataNewAssets.push([dt, new_assets])
        dataTrustlines.push([dt, trustlines])
        dataFundedTrustlines.push([dt, funded_trustlines])
    }

    config.series.push({
        type: 'area',
        name: 'Total Established Trustlines',
        data: dataTrustlines,
        dataGrouping: {
            approximation: 'high'
        }
    })
    config.series.push({
        type: 'column',
        name: 'Newly Created Assets',
        yAxis: 1,
        data: dataNewAssets,
        dataGrouping: {
            approximation: 'sum'
        },
        index: 2
    })
    config.series.push({
        type: 'line',
        name: 'Total Funded Trustlines',
        data: dataFundedTrustlines,
        dataGrouping: {
            approximation: 'high'
        },
        index: 1
    })
    return <Chart type="StockChart" options={config} className={className} grouped range title={noTitle ? null : <>
        New Assets and Trustlines
        <EmbedWidgetTrigger path="network-activity/assets" title="Stellar Network Stats - New Assets and Trustlines"/>
    </>}/>
})