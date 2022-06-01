import React from 'react'
import Chart from '../../../components/chart-view'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default function AssetPaymentsChartView({asset}) {
    const {data, loaded} = useAssetHistory(asset)
    if (!loaded) return <div className="loader"/>
    const code = asset.toCurrency(),
        title = `Total transferred ${code} amount`,
        options = {
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
    return <Chart {...{title, options}} type="StockChart" grouped range={true}/>
}