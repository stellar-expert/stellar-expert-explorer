import {parseQuery, stringifyQuery} from '@stellar-expert/navigation'

const authTokenStore = window.localStorage

function getAuthTokenStoreKey(provider) {
    return 'oauth_' + provider.name + 'authtoken'
}

function isExpired(timestamp) {
    return (timestamp - 1) * 1000 < new Date().getTime()
}

export default class OAuthProvider {
    constructor(params) {
        Object.assign(this, params)
        window[this.name + 'ProcessCallbackUrl'] = this.processCallbackUrl.bind(this)
        this.eventListeners = {}
    }

    /**
     * Provider name
     * @type {OAuthProviderName}
     */
    name
    /**
     * Client identifier of the authroized application
     * @type {String}
     */
    clientId
    /**
     * OAuth authorization API endpoint
     * @type {String}
     */
    loginUrl
    /**
     * OAuth scope requested by the provider
     * @type {String}
     */
    scope = 'profile'
    /**
     * OAuth redirect relative URL
     * @type {String}
     */
    oauthRedirectUrl = '/oauthcallback.html'
    /**
     * API endpoints base URL
     * @type {String}
     */
    apiEndpoint = null
    /**
     * @type {{success: Function, fail: Function}|null}
     */
    oAuthCallbackContext = null

    /**
     * @type {OAuthUserInfo|Promise}
     */
    profileInfo

    eventListeners

    /**
     * Retrieve authorization token for API requests
     * @return {String}
     */
    get authToken() {
        let stored = authTokenStore[getAuthTokenStoreKey(this)]
        if (!stored) return null
        stored = JSON.parse(stored)
        if (isExpired(stored.expires)) {
            this.logOut(false)
            return null
        }
        return stored.token
    }

    /**
     * Check if a user is authenticated
     * @return {Boolean}
     */
    get isAuthenticated() {
        const {authToken} = this
        return !!authToken && !isExpired(authToken.expires)
    }

    /**
     * Set authorization token
     * @param {String} token - Auth token
     * @param {Number} [expires] - Expiration timestamp (Unix date)
     */
    setAuthToken(token, expires) {
        const data = {token}
        if (expires !== undefined) {
            data.expires = new Date().getTime() / 1000 | 0 + expires
        }
        authTokenStore[getAuthTokenStoreKey(this)] = JSON.stringify(data)
        this.emit('authenticated', this)
    }

    /**
     * Request general user profile info from OAuth provider
     * @return {Promise<OAuthUserInfo>}
     */
    getProfileInfo() {
        if (!this.authToken)
            return Promise.reject()
        if (!this.profileInfo) {
            this.profileInfo = this.fetchProfileInfo()
        }
        if (this.profileInfo instanceof Promise) return this.profileInfo
        return Promise.resolve(this.profileInfo)
    }

    /**
     * @protected
     * @return {Promise<OAuthUserInfo>}
     */
    fetchProfileInfo() {
        throw new Error('fetchProfileInfo not implemented in provider ' + this.name)
    }

    /**
     * Process response from OAuth source
     * @param {String} url
     * @return {Boolean}
     */
    processCallbackUrl(url) {
        const params = this.getQueryParams(url)
        const error = params['error_message']
        if (error) {
            console.error(error)
            this.oAuthCallbackContext?.fail()
            return true
        }
        const token = params['access_token']
        if (token) {
            this.setAuthToken(token, params.expires)
            this.oAuthCallbackContext?.success()
            return true
        }
        return false
    }

    /**
     * Request OAuth login
     * @return {Promise}
     */
    login() {
        if (this.isAuthenticated) return Promise.resolve()

        return new Promise((resolve, reject) => {
            this.oAuthCallbackContext = {
                success: resolve,
                fail: reject
            }
            const authWindow = window.open(this.getFullAuthUrl(), this.name, 'location=no,toolbar=no,clearcache=yes')
        })
    }

    /**
     * End OAuth session
     */
    logOut(revoke = true) {
        if (revoke && this.revokePermissions) {
            this.revokePermissions()
        }
        authTokenStore.removeItem(getAuthTokenStoreKey(this))
        this.emit('unauthenticated', this)
    }

    /**
     * Execute arbitrary API request to the OAuth provider
     * @param {ApiCallParams} params
     * @return {Promise<Object>}
     */
    invokeApi(params) {
        const data = Object.assign({}, params.data, {access_token: this.authToken})
        let url = (data.apiEndpoint || this.apiEndpoint) + params.path
        let body
        const headers = {
            Accept: 'application/json',
            Authorization: `token ${this.authToken}`
        }
        if (params.method && params.method !== 'GET') {
            headers['Content-Type'] = 'application/json'
            body = JSON.stringify(data)
        } else {
            url += stringifyQuery(data)
        }
        return fetch(url, {
            method: params.method || 'GET',
            cache: 'no-cache',
            mode: 'cors',
            headers,
            body
        }).then(res => res.json())
    }

    /**
     * @param {OAuthProviderEvent} event
     * @param {Function} callback
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = []
        }
        this.eventListeners[event].push(callback)
    }

    /**
     * @param {OAuthProviderEvent} event
     * @param {Function} callback
     */
    off(event, callback) {
        const listeners = this.eventListeners[event] || []
        const pos = listeners.indexOf(callback)
        if (pos >= 0) {
            listeners.splice(pos, 1)
        }
    }

    /**
     * @private
     * @param {OAuthProviderEvent} event
     */
    emit(event) {
        const listeners = this.eventListeners[event]
        if (!listeners) return
        for (const listener of listeners) {
            listener(this, event)
        }
    }

    /**
     * @private
     * @return {String}
     */
    getFullAuthUrl() {
        let params = {
            client_id: this.clientId,
            response_type: 'token'
        }
        if (~this.oauthRedirectUrl.indexOf('://')) {
            params.redirect_uri = this.oauthRedirectUrl
        } else {
            params.redirect_uri = window.location.origin + this.oauthRedirectUrl
        }

        if (this.scope) params.scope = this.scope
        return this.loginUrl + stringifyQuery(params)
    }

    /**
     * @private
     * @param {String} url
     * @return {{}}
     */
    getQueryParams(url) {
        let queryString = url.split('#')[1]
        if (!queryString) {
            queryString = url.split('?')[1]
        }
        return parseQuery(queryString)
    }
}

/**
 * Event emmited by OAuth providers
 * @typedef {'authenticated'|'unauthenticated'} OAuthProviderEvent
 */

/**
 * @typedef {'github'} OAuthProviderName
 */

/**
 * @typedef {Object} OAuthUserInfo
 * @property {String} id
 * @property {String} name
 * @property {OAuthProviderName} name
 * @property {String} avatar
 */

/**
 * @typedef {Object} ApiCallParams
 * @property {String} path - Relative URL path
 * @property {Object} data - Request query/body params
 * @property {'GET'|'POST'|'PUT'|'DELETE'} [method] - HTTP method
 * @property {String} [apiEndpoint] - API server URL origin
 *
 */