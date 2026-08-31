import React from 'react'
import {Auth0Provider} from '@auth0/auth0-react'
import {navigation} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'

export default function Auth0ProviderLayout({children}) {
    const params = {
        domain: appSettings.auth0.domain,
        clientId: appSettings.auth0.clientId,
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        authorizationParams: {
            redirect_uri: window.location.origin + '/login',
            audience: appSettings.auth0.audience,
            scope: 'openid profile email'
        },
        onRedirectCallback: appState => {
            const targetUrl = appState?.returnTo || window.location.pathname
            navigation.history.push(targetUrl)
        }
    }

    return <Auth0Provider {...params}>
        {children}
    </Auth0Provider>
}