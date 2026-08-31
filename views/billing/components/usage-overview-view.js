import React from 'react'
import {useUsageStats} from '../utils/usage-hooks'
import StatisticsView from './statistics-view'
import VolumeChartView from './volume-chart-view'
import EndpointUsageView from './endpoint-usage-view'

/**
 * Charged requests summary, the 30-day usage chart, and the per-endpoint breakdown behind it
 * @param {String} [accountId] - the single account to report on
 * @param {Boolean} [allAccounts] - report across every account instead (admin only)
 * @return {JSX.Element}
 */
export default function UsageOverviewView({accountId, allAccounts}) {
    const {summary, usage} = useUsageStats(accountId, allAccounts)

    return <>
        <StatisticsView summary={summary}/>
        <VolumeChartView stats={usage}/>
        <EndpointUsageView endpoints={summary?.month?.endpoints}/>
    </>
}