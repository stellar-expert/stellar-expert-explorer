import React, {memo} from 'react'
import {Chart} from '@stellar-expert/ui-framework'
import DashboardSectionView from './dashboard-section-view'

const chartWindowDays = 30
const dayDuration = 24 * 60 * 60 * 1000

/**
 * Project daily aggregates onto a fixed 30-day window ending today
 * @param {{ts: Number, stats: {status: String, requests: Number}[]}[]} stats
 * @return {{successRequests: [Number, Number][], failedRequests: [Number, Number][]}}
 * @private
 */
function buildChartWindow(stats) {
    const statsByDay = new Map()
    for (const stat of stats) {
        statsByDay.set(new Date(stat.ts * 1000).setUTCHours(0, 0, 0, 0), stat.stats)
    }
    const today = new Date().setUTCHours(0, 0, 0, 0)
    const successRequests = []
    const failedRequests = []
    for (let i = chartWindowDays - 1; i >= 0; i--) {
        const date = today - i * dayDuration
        const dayStats = statsByDay.get(date)
        successRequests.push([date, dayStats?.find(s => s.status === 'success')?.requests || 0])
        failedRequests.push([date, dayStats?.find(s => s.status === 'failed')?.requests || 0])
    }
    return {successRequests, failedRequests}
}

/**
 * Stacked daily request volume for the trailing 30 days
 * @param {{}[]} [stats]
 * @return {JSX.Element|null}
 */
export default memo(function VolumeChartView({stats}) {
    if (!stats)
        return null

    const {successRequests, failedRequests} = buildChartWindow(stats)
    const options = {
        chart: {
            //the section already carries a heading, so the plot gets the full height of the card
            spacingTop: 0
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 0
            }
        },
        yAxis: {
            title: {
                text: null
            }
        },
        legend: {
            enabled: true,
            verticalAlign: 'bottom'
        },
        series: [
            {
                data: failedRequests,
                name: 'Failed requests',
                type: 'column',
                color: 'hsl(27,93%,66%)',
                legendIndex: 1
            },
            {
                data: successRequests,
                name: 'Successful requests',
                type: 'column',
                color: 'var(--color-highlight)',
                legendIndex: 0
            }
        ]
    }

    return <DashboardSectionView title="Usage" aside={`Last ${chartWindowDays} days`}>
        <div className="panel billing-usage-chart">
            <Chart options={options} container=""/>
        </div>
    </DashboardSectionView>
})