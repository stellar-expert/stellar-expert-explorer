import React, {useCallback, useEffect, useState} from 'react'
import {navigation} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {getRoles, getSession, getToken, isSignedIn, logOut, mustSetPassword}
    from '../../../business-logic/billing/billing-session'
import {isImpersonating} from '../../../business-logic/billing/impersonation'
import {session, SessionContext, useSession} from './session-context'

export {useSession}

/**
 * Session state
 * @param {{children: JSX.Element}} props
 * @return {JSX.Element}
 */
export function SessionProvider({children}) {
    const [userSession, setUserSession] = useState(session)

    session.getToken = getToken

    const syncSession = useCallback(() => {
        session.roles = getRoles()
        session.mustSetPassword = mustSetPassword()
        session.impersonated = isImpersonating()
        resolveAccount()
            .then(account => {
                session.userId = account?.id || null
                session.email = account?.email || null
                session.inactive = !!account?.inactive
            })
            .finally(() => setUserSession({...session, synced: true}))
    }, [])

    useEffect(syncSession, [syncSession])

    //a token that can no longer be renewed means the session is over, wherever the failure surfaced
    useEffect(() => {
        if (!isSignedIn())
            return
        getToken().catch(() => {
            notify({type: 'error', message: 'Your session has expired. Please sign in again'})
            logOut().finally(() => navigation.navigate('/login'))
        })
    }, [])

    return <SessionContext.Provider value={{...userSession, reload: syncSession}}>
        {children}
    </SessionContext.Provider>
}

/**
 * The account the dashboard renders, which is the one its requests authorize as
 * @return {Promise<{id: String, email: String, inactive: Boolean}|null>}
 * @private
 */
async function resolveAccount() {
    const stored = getSession()?.account
    if (!isImpersonating() && !stored?.inactive)
        return stored || null
    try {
        return await apiRequest('auth/session', {method: 'POST'})
    } catch (e) {
        notify({type: 'error', message: e.message || 'Could not load the account'})
        return stored || null
    }
}