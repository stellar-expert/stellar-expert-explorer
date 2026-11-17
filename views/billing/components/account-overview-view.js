import React from 'react'
import {useUsageStats} from '../utils/usage-hooks'
import StatisticsView from './statistics-view'
import BillingPeriodView from './billing-period-view'
import VolumeChartView from './volume-chart-view'
import EndpointUsageView from './endpoint-usage-view'

/**
 * Usage of one account - counters, how much of the monthly allowance is spent and what spent it. The customer
 * sees it on their overview page, staff on the account page
 * @param {String} [accountId] - undefined while the session resolves
 * @param {{}} [account] - undefined while it loads
 * @param {{href: String, title: String}} [planAction] - where the plan button leads, when not the customer's own
 * plan page
 * @return {JSX.Element}
 */
export default function AccountOverviewView({accountId, account, planAction}) {
    const {summary, usage} = useUsageStats(accountId)

    return <>
        <StatisticsView summary={summary}/>
        <BillingPeriodView account={account} usage={usage} planAction={planAction}/>
        <VolumeChartView stats={usage}/>
        <EndpointUsageView endpoints={summary?.month?.endpoints}/>
    </>
}
