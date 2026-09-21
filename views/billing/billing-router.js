import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import Loadable from '../components/loadable'
import LoginFormView from './auth/login-form-view'
import ResetPasswordView from './auth/reset-password-view'
import UserRouter from './pages/user/user-router'
import ConfirmationDialogView from './utils/confirm-action'

/**
 * Billing dashboard router - mounted on /account, /admin, /login and /reset-password
 */
export default function BillingRouter() {
    return <>
        <RouterSwitch>
            <Route path="/admin">
                <Loadable moduleKey="billing-admin"
                          load={() => import(/* webpackChunkName: "billing-admin" */ './pages/admin/admin-router')}/>
            </Route>
            <Route path="/account" component={UserRouter}/>
            <Route path="/login" component={LoginFormView}/>
            <Route path="/reset-password" component={ResetPasswordView}/>
        </RouterSwitch>
        <ConfirmationDialogView/>
    </>
}