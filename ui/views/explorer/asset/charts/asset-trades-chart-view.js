import React from 'react'
import Chart from '../../../components/chart/chart'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default Chart.withErrorBoundary(function AssetTradesChartView({asset}) {
    const {data, loaded} = useAssetHistory(asset)
    if (!loaded)
        return <Chart.Loader/>
    if (!(data?.history instanceof Array))
        return <Chart.Loader unavailable/>
    const code = asset.descriptor.toCurrency()
    const title = `Total traded ${code} amount`
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
            }
        }],
        series: [{
            type: 'column',
            name: `${code} traded across all pairs`,
            data: (data.history || []).map(d => [d.ts, Math.round(d.traded_amount / 10000000)]),
            tooltip: {
                valueSuffix: ' ' + code
            }
        }]
    }
    return <Chart {...{options, title}} type="StockChart" grouped range/>
})