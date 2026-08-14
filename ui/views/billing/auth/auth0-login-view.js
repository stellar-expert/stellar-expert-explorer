import React, {useCallback, useEffect} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {Button, navigation} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'
import SimplePageLayout from '../layout/simple-page-layout'
import SegmentLoader from '../utils/segment-loader-view'

export default function Auth0LoginView() {
    const {isAuthenticated, loginWithRedirect, error, isLoading, user} = useAuth0()

    useEffect(() => {
        if (!isAuthenticated)
            return null

        const isAdmin = checkAccess('admin', user)
        navigation.history.push(isAdmin ? '/admin' : '/account')
    }, [isAuthenticated, user])

    const login = useCallback(() => loginWithRedirect({
        appState: {
            returnTo: window.location.pathname
        }
    }), [])

    if (isLoading)
        return <SegmentLoader/>

    if (error)
        notify({type: 'error', message: error.message || 'An unexpected authorization error occurred'})

    return <div className="container">
        <div className="row micro-space">
            <div className="column column-50 column-offset-25">
                <SimplePageLayout title="Authorization" center>
                    <div>
                        Secure and seamless access to your account via Auth0.
                        Log in with your email or social provider to manage your account.
                    </div>
                    <div className="row space">
                        <div className="column column-50 column-offset-25">
                            <Button onClick={login} disabled={isLoading} block>Authorize</Button>
                        </div>
                    </div>
                </SimplePageLayout>
            </div>
        </div>
    </div>
}

export function checkAccess(role, user = {}) {
    const userRoles = user[appSettings.auth0.audience + '/roles'] || []
    const roles = userRoles.length ? userRoles : ['user']
    return roles.includes(role)
}