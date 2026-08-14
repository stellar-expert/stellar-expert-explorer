import React, {useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import {useUsageStats} from '../../utils/usage-hooks'
import SimplePageLayout from '../../layout/simple-page-layout'
import StatisticsView from '../../components/statistics-view'
import BillingPeriodView from '../../components/billing-period-view'
import VolumeChartView from '../../components/volume-chart-view'
import EndpointUsageView from '../../components/endpoint-usage-view'

/**
 * Account overview - counters, how much of the monthly allowance is spent, and what spent it
 * @return {JSX.Element}
 */
export default function OverviewPage() {
    const {userId} = useSession()
    const {summary, usage} = useUsageStats(userId)
    const [account, setAccount] = useState()

    useEffect(() => {
        if (!userId)
            return

        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
    }, [userId])

    return <SimplePageLayout title="Overview">
        <StatisticsView summary={summary}/>
        <BillingPeriodView account={account} used={summary?.month?.credits}/>
        <VolumeChartView stats={usage}/>
        <EndpointUsageView endpoints={summary?.month?.endpoints}/>
    </SimplePageLayout>
}