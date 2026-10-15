import React from 'react'
import {isSignedIn} from '../../../business-logic/billing/billing-session'
import {isImpersonating} from '../../../business-logic/billing/impersonation'
import {useSession} from '../auth/auth-session'
import {AuthScreenView} from '../auth/auth-form'
import LoginFormView from '../auth/login-form-view'
import AccountRestoreView from '../auth/account-restore-view'
import SetPasswordView from '../auth/set-password-view'
import SegmentLoader from '../utils/segment-loader-view'

/**
 * Log in to the dashboard
 * @param {'user'|'admin'} role - the access dashboard requires
 * @param {*} children
 * @return {JSX.Element}
 */
export default function AuthLayout({role, children}) {
    const userSession = useSession()
    //an impersonation token carries no roles at all
    const isAllowed = (role === 'user' && isImpersonating()) || hasRole(role, userSession)

    if (!isSignedIn())
        return <LoginFormView/>
    if (!userSession.synced)
        return <SegmentLoader/>
    if (userSession.mustSetPassword)
        return <SetPasswordView/>
    if (userSession.inactive)
        return <AccountRestoreView/>
    if (!isAllowed)
        return <NoAccessView/>
    //show content
    return children
}

/**
 * Whether a session may see a dashboard of this kind
 * @param {'user'|'admin'} role
 * @param {{roles: String[]}} session
 * @return {Boolean}
 * @private
 */
function hasRole(role, {roles}) {
    const granted = roles?.length ? roles : ['user']
    //an admin reaches the customer dashboard too, the way the API grants them any account
    return granted.includes(role) || (role === 'user' && granted.includes('admin'))
}

/**
 * Shown to a signed-in session whose roles do not cover this dashboard
 * @return {JSX.Element}
 * @private
 */
function NoAccessView() {
    return <AuthScreenView title="No access" textFirst>
        <p className="dimmed text-small">
            This account cannot open this dashboard. Go to <a href="/account">your account</a>, or
            sign in with one that has access.
        </p>
    </AuthScreenView>
}