import React from 'react'
import Chart from '../../../components/chart-view'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default function AssetTradesChartView({asset}) {
    const {data, loaded} = useAssetHistory(asset)
    if (!loaded) return <div className="loader"/>
    const code = asset.descriptor.toCurrency(),
        title = `Total traded ${code} amount`,
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
    return <Chart {...{options, title}} type="StockChart" grouped range={true}/>
}