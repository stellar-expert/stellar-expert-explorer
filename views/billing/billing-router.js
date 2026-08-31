import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import Loadable from '../components/loadable'
import Auth0ProviderLayout from './auth/auth0-provider-layout'
import Auth0LoginView from './auth/auth0-login-view'
import UserRouter from './pages/user/user-router'
import ConfirmationDialogView from './utils/confirm-action'

/**
 * Billing dashboard router - mounted on /account, /admin and /login
 */
export default function BillingRouter() {
    return <Auth0ProviderLayout>
        <RouterSwitch>
            <Route path="/admin">
                <Loadable moduleKey="billing-admin"
                          load={() => import(/* webpackChunkName: "billing-admin" */ './pages/admin/admin-router')}/>
            </Route>
            <Route path="/account" component={UserRouter}/>
            <Route path="/login" component={Auth0LoginView}/>
        </RouterSwitch>
        <ConfirmationDialogView/>
    </Auth0ProviderLayout>
}