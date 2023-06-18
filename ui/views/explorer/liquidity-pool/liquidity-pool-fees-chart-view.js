import React from 'react'
import {usePoolHistory} from '../../../business-logic/api/lp-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function LiquidityPoolFeesChartView({id}) {
    const poolHistory = usePoolHistory(id)
    if (!poolHistory.loaded)
        return <Chart.Loader/>
    if (poolHistory.error || !poolHistory.data.length) return null

    const earned = []
    const apy = []
    for (let i = poolHistory.data.length - 1; i >= 0; i--) {
        const entry = poolHistory.data[i]
        earned.push([entry.ts * 1000, Math.round(entry.earned_fees_value / 10000000)])
        apy.push([entry.ts * 1000, Math.round(10000 * 365 * entry.earned_fees_value / entry.total_value_locked) / 100])
    }

    const config = {
        yAxis: [{
            title: {
                text: 'Earned Fees'
            }
        }, {
            title: {
                text: 'Projected Annualized Profitability'
            },
            opposite: true
        }],
        series: [
            {
                type: 'column',
                name: 'Earned Fees',
                data: earned,
                tooltip: {
                    valueSuffix: ' USD'
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            },
            {
                type: 'line',
                name: 'Projected Profitability',
                yAxis: 1,
                data: apy,
                tooltip: {
                    valueSuffix: '%'
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            }]
    }

    return <Chart options={config} grouped range noLegend title="Earned Fees"/>
})