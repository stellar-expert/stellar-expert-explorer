import {fetchData} from '@stellar-expert/ui-framework'
import appSettings from '../../app-settings'
import OAuthProvider from './oauth-provider'

class GithubOAuthProvider extends OAuthProvider {
    constructor(props) {
        super({
            ...props,
            name: 'github',
            clientId: appSettings.oauth.github.clientId,
            scope: 'read:user user:email',
            loginUrl: 'https://github.com/login/oauth/authorize',
            apiEndpoint: 'https://api.github.com'
        })
    }

    /**
     * @return {Promise<OAuthUserInfo>}
     */
    fetchProfileInfo() {
        return this.login()
            .then(() => this.invokeApi({
                path: '/user'
            }))
            .then(res => {
                if (res.error) return Promise.reject(res.error)
                return {
                    id: res.id,
                    name: res.login,
                    provider: 'github',
                    avatar: res.avatar_url
                }
            })
    }

    processCallbackUrl(callbackUrl) {
        const callbackParams = this.getQueryParams(callbackUrl)
        const {code, error_message: error, access_token: token} = callbackParams

        if (error) {
            console.error(error)
            this.oAuthCallbackContext?.fail()
            return true
        }

        fetchData(`oauth/github/exchange-token?client_id=${this.clientId}&code=${code}`)
            .then(res => {
                if (res.data?.access_token) {
                    this.setAuthToken(res.data.access_token)
                    this.oAuthCallbackContext?.success()
                    return true
                }
            })
    }

    revokePermissions() {
        return this.invokeApi({
            method: 'DELETE',
            path: `/applications/${this.clientId}/grant`,
            data: {client_id: this.clientId}
        })
    }
}

export default new GithubOAuthProvider()