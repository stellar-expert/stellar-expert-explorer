import React from 'react'
import {Route, RouterSwitch, useRouteMatch} from '@stellar-expert/ui-framework'
import DashboardLayout from '../../layout/dashboard-layout'
import NotFoundPage from '../../../pages/not-found-page-view'
import DashboardPage from './dashboard-page'
import LogsPage from './logs-page'
import UserBillingHistoryPage from './user-billing-history-page'
import UserSubscriptionPage from './user-subscription-page'
import UsersPage from './users-page'
import UserPage from './user-page'

export default function AdminRouter() {
    const {path} = useRouteMatch()
    return <DashboardLayout role="admin">
        <RouterSwitch>
            <Route path={`${path}/user/:id/billing-history`} component={UserBillingHistoryPage}/>
            <Route path={`${path}/user/:id/subscription`} component={UserSubscriptionPage}/>
            <Route path={`${path}/user/:id`} component={UserPage}/>
            <Route path={`${path}/user`} component={UsersPage}/>
            <Route path={`${path}/logs`} component={LogsPage}/>
            <Route path={`${path}/`} component={DashboardPage}/>
            <Route component={NotFoundPage}/>
        </RouterSwitch>
    </DashboardLayout>
}