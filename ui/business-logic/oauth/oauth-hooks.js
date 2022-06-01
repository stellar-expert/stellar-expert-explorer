import {useEffect, useState} from 'react'
import githubOauthProvider from './github-oauth-provider'

function resolveProvider(provider) {
    switch (provider) {
        case 'github':
            return githubOauthProvider
    }
    throw new Error(`Unknown OAuth provider: ${provider}`)
}

/**
 * OAuth connection React hook
 * @param {OAuthProviderName} provider
 * @return {[OAuthUserInfo, OAuthProvider]} Authenticated state and OAuth provider instance
 */
export function useOAuth(provider) {
    const [userInfo, setUserInfo] = useState(null)
    const [oAuthProvider, setOAuthProvider] = useState(null)
    useEffect(() => {
        const providerInstance = resolveProvider(provider)

        function onLogOut() {
            setUserInfo(null)
        }

        function onLogin() {
            providerInstance.getProfileInfo()
                .then(user => setUserInfo(user))
                .catch(() => null)
        }

        providerInstance.on('unauthenticated', onLogOut)
        providerInstance.on('authenticated', onLogin)
        setOAuthProvider(providerInstance)
        onLogin()
        return () => {
            providerInstance.off('unauthenticated', onLogOut)
            providerInstance.off('authenticated', onLogin)
        }
    }, [provider])
    return [userInfo, oAuthProvider]
}

/**
 * Github OAuth connection React hook
 * @return {[OAuthUserInfo, OAuthProvider]}
 */
export function useGithubOAuth() {
    return useOAuth('github')
}