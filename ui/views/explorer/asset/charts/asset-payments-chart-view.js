import React from 'react'
import Chart from '../../../components/chart/chart'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default Chart.withErrorBoundary(function AssetPaymentsChartView({asset}) {
    const {data, loaded} = useAssetHistory(asset)
    if (!loaded)
        return <Chart.Loader/>
    if (!(data?.history instanceof Array))
        return <Chart.Loader unavailable/>
    const code = asset.toCurrency()
    const title = `Total transferred ${code} amount`
    const options = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum',
                    forced: true,
                    groupPixelWidth: 26
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Volume'
            },
            min: 0
        }],
        series: [{
            type: 'column',
            name: `${code} payments volume`,
            data: data.history.map(d => [d.ts, Math.round(d.payments_amount / 10000000)]),
            tooltip: {
                valueSuffix: ' ' + code
            }
        }]
    }
    return <Chart {...{title, options}} type="StockChart" grouped range/>
})