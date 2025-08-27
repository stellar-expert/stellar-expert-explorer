import React from 'react'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerSupplyFeeChartView({className, noTitle}) {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        plotOptions: {
            series: {
                clip: true,
                dataGrouping: {
                    groupPixelWidth: 30
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Total XLM'
            },
            height: '80%',
            offset: 40
        }, {
            title: {
                text: 'Fee Pool'
            },
            top: '80%',
            height: '20%',
            offset: 40
        }],
        series: []
    }
    const dataSupply = []
    const dataPool = []
    for (const {ts, total_xlm, reserve, fee_pool} of data) {
        const dt = ts * 1000
        dataSupply.push([dt, (Math.round((total_xlm - reserve) / 10000000) || 0)])
        dataPool.push([dt, Math.round(fee_pool / 10000000)])
    }

    config.series.push({
        type: 'area',
        name: 'XLM Supply',
        data: dataSupply,
        tooltip: {valueSuffix: ' XLM'},
        dataGrouping: {
            approximation: 'high'
        }
    })
    config.series.push({
        type: 'area',
        name: 'Fee Pool',
        tooltip: {valueSuffix: ' XLM'},
        yAxis: 1,
        data: dataPool,
        dataGrouping: {
            approximation: 'high'
        }
    })
    return <Chart type="StockChart" options={config} className={className} grouped range title={noTitle ? null : <>
        Circulating XLM Supply and Fee Pool
        <EmbedWidgetTrigger path="network-activity/supply-fee"
                            title="Stellar Network - Circulating XLM Supply and Fee Pool"/>
    </>}/>
})