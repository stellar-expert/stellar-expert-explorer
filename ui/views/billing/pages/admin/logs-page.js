import React from 'react'
import SimplePageLayout from '../../layout/simple-page-layout'
import LogsView from '../../admin/logs-view'

export default function LogsPage() {
    return <SimplePageLayout title="Logs">
        <LogsView/>
    </SimplePageLayout>
}