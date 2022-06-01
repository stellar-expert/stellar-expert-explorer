import React from 'react'
import {usePoolHistory} from '../../../business-logic/api/lp-api'
import Chart from '../../components/chart-view'

export default function LiquidityPoolFeesChartView({id}) {
    const poolHistory = usePoolHistory(id)
    if (!poolHistory.loaded) return <div className="loader"/>
    if (poolHistory.error || !poolHistory.data.length) return null

    const earned = [],
        apy = []
    for (let entry of poolHistory.data) {
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
                maxPointWidth: 12,
                tooltip: {
                    valueSuffix: ' USD'
                }
            },
            {
                type: 'line',
                name: 'Projected Profitability',
                yAxis: 1,
                data: apy,
                maxPointWidth: 12,
                tooltip: {
                    valueSuffix: '%'
                }
            }]
    }

    return <Chart options={config} grouped range noLegend title="Earned Fees"/>
}