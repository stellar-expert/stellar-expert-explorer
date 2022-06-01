import React from 'react'
import {usePoolHistory} from '../../../business-logic/api/lp-api'
import Chart from '../../components/chart-view'

export default function LiquidityPoolTradesChartView({id}) {
    const poolHistory = usePoolHistory(id)
    if (!poolHistory.loaded) return <div className="loader"/>
    if (poolHistory.error || !poolHistory.data.length) return null

    const trades = [],
        volumes = []
    for (let entry of poolHistory.data) {
        trades.push([entry.ts * 1000, Math.round(entry.trades)])
        volumes.push([entry.ts * 1000, Math.round(entry.volume_value / 10000000)])
    }

    const config = {
        yAxis: [{
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: ''
            },
            floor: 0,
            height: '82%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: ''
            },
            //softMin: 0,
            top: '85%',
            height: '15%',
            offset: 0,
            lineWidth: 2
        }],
        series: [
            {
                type: 'column',
                name: 'Trades',
                maxPointWidth: 12,
                data: trades,
                dataGrouping: {
                    approximation: 'sum'
                }
            },
            {
                type: 'column',
                name: 'Volume',
                yAxis: 1,
                maxPointWidth: 12,
                data: volumes,
                tooltip: {
                    valueSuffix: ' USD'
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            }]
    }

    return <Chart title="Pool Trading Volumes" options={config} grouped range noLegend/>
}