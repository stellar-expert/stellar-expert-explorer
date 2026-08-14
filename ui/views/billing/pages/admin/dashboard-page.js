import React from 'react'
import SimplePageLayout from '../../layout/simple-page-layout'
import UsageOverviewView from '../../components/usage-overview-view'

export default function DashboardPage() {
    return <SimplePageLayout title="Dashboard">
        <UsageOverviewView allAccounts/>
    </SimplePageLayout>
}