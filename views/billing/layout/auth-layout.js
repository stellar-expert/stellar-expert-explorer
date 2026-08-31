import React from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {hasImpersonationSession} from '../../../business-logic/billing/auth0-session-probe'
import {useSession} from '../auth/auth-session'
import Auth0LoginView, {checkAccess} from '../auth/auth0-login-view'
import AccountRestoreView from '../auth/account-restore-view'
import SegmentLoader from '../utils/segment-loader-view'

export default function AuthLayout({role, children}) {
    const {isAuthenticated, user} = useAuth0()
    const userSession = useSession()
    const isAllowed = (role === 'user' && hasImpersonationSession()) || checkAccess(role, {...user, ...userSession})

    if (!isAuthenticated)
        return <Auth0LoginView/>
    if (!userSession.synced)
        return <SegmentLoader/>
    if (userSession.inactive)
        return <AccountRestoreView/>
    if (!isAllowed)
        return <Auth0LoginView/>
    //show content
    return children
}
