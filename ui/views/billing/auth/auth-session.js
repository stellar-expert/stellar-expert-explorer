import React, {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {navigation} from '@stellar-expert/ui-framework'
import {performApiCall} from '../../../business-logic/billing/billing-api'

export const session = {
    userId: null,
    //the account the dashboard is actually showing, which is not the Auth0 identity of the browser while an
    //admin is signed in as somebody else - anything naming the customer has to read it from here
    email: null,
    inactive: false,
    getToken: null
}

const SessionContext = createContext(session)

export const SessionProvider = ({children}) => {
    const {isAuthenticated, getAccessTokenSilently, logout} = useAuth0()
    const [userSession, setUserSession] = useState(session)
    session.getToken = getAccessTokenSilently

    //exposed as `reload` so the account restore flow can pick up the cleared `inactive` flag
    const syncSession = useCallback(() => {
        if (!isAuthenticated)
            return
        resolveSession(getAccessTokenSilently, logout)
            .finally(() => setUserSession({...session, synced: true}))
    }, [isAuthenticated, getAccessTokenSilently, logout])

    useEffect(syncSession, [syncSession])

    return <SessionContext.Provider value={{...userSession, reload: syncSession}}>
        {children}
    </SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)

/**
 * Load the signed-in account, or end the session when the browser can no longer obtain a token
 * @param {Function} getToken
 * @param {Function} logout
 * @return {Promise}
 * @private
 */
async function resolveSession(getToken, logout) {
    try {
        await getToken()
    } catch (e) {
        console.warn('Cannot obtain an access token - ending the session', e)
        session.userId = null
        session.email = null
        session.inactive = false
        notify({type: 'error', message: 'Your session has expired. Please sign in again'})
        await logout({openUrl: false})
        navigation.navigate('/login')
        return
    }
    const {id, email, inactive, error} = await performApiCall('auth/session', {method: 'POST'})
    if (error)
        return notify({type: 'error', message: error})
    session.userId = id
    session.email = email || null
    session.inactive = !!inactive
}