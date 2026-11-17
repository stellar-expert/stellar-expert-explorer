import React from 'react'
import {Redirect, Route, RouterSwitch, useParams, useRouteMatch} from '@stellar-expert/ui-framework'
import DashboardLayout from '../../layout/dashboard-layout'
import NotFoundPage from '../../../pages/not-found-page-view'
import DashboardPage from './dashboard-page'
import LogsPage from './logs-page'
import UserSubscriptionPage from './user-subscription-page'
import UsersPage from './users-page'
import UserPage from './user-page'

export default function AdminRouter() {
    const {path} = useRouteMatch()
    return <DashboardLayout role="admin">
        <RouterSwitch>
            <Route path={`${path}/user/:id/billing-history`} component={UserBillingHistoryRedirect}/>
            <Route path={`${path}/user/:id/subscription`} component={UserSubscriptionPage}/>
            <Route path={`${path}/user/:id`} component={UserPage}/>
            <Route path={`${path}/user`} component={UsersPage}/>
            <Route path={`${path}/logs`} component={LogsPage}/>
            <Route path={`${path}/`} component={DashboardPage}/>
            <Route component={NotFoundPage}/>
        </RouterSwitch>
    </DashboardLayout>
}

/**
 * Billing history used to have a page of its own - it is a tab of the account page now
 * @return {JSX.Element}
 * @private
 */
function UserBillingHistoryRedirect() {
    const {id} = useParams()
    return <Redirect to={`/admin/user/${id}?tab=billing-history`}/>
}
