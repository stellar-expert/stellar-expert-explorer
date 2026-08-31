import React from 'react'
import {Route, RouterSwitch, useRouteMatch} from '@stellar-expert/ui-framework'
import DashboardLayout from '../../layout/dashboard-layout'
import NotFoundPage from '../../../pages/not-found-page-view'
import OverviewPage from './overview-page'
import ApiKeysPage from './api-keys-page'
import SubscriptionPage from './subscription-page'
import ChangePlanPage from './change-plan-page'
import CheckoutPage from './checkout-page'
import BillingHistoryPage from './billing-history-page'

export default function UserRouter() {
    const {path} = useRouteMatch()
    return <DashboardLayout role="user">
        <RouterSwitch>
            <Route path={`${path}/api-keys`} component={ApiKeysPage}/>
            <Route path={`${path}/subscription/change`} component={ChangePlanPage}/>
            <Route path={`${path}/subscription/checkout`} component={CheckoutPage}/>
            <Route path={`${path}/subscription`} component={SubscriptionPage}/>
            <Route path={`${path}/billing-history`} component={BillingHistoryPage}/>
            <Route path={`${path}/`} component={OverviewPage}/>
            <Route component={NotFoundPage}/>
        </RouterSwitch>
    </DashboardLayout>
}