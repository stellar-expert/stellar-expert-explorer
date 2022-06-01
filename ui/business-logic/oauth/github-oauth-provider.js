import OAuthProvider from './oauth-provider'
import appSettings from '../../app-settings'

class GithubOAuthProvider extends OAuthProvider {
    constructor(props) {
        super(Object.assign({}, props, {
            name: 'github',
            clientId: appSettings.oauth.github.clientId,
            scope: 'read:user user:email',
            loginUrl: 'https://github.com/login/oauth/authorize',
            apiEndpoint: 'https://api.github.com'
        }))
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
        const callbackParams = this.getQueryParams(callbackUrl),
            {code, error_message: error, access_token: token} = callbackParams

        if (error) {
            console.error(error)
            this.oAuthCallbackContext?.fail()
            return true
        }

        fetchExplorerApi(`oauth/github/exchange-token?client_id=${this.clientId}&code=${code}`)
            .then(res => {
                if (res.access_token) {
                    this.setAuthToken(res.access_token)
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