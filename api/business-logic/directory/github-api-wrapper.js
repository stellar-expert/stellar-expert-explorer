const {fetch} = require('../../utils/fetch-helper')

const userDetailsCache = {}

class GithubApiWrapper {
    /**
     * @param {String} authToken
     * @param {String} repository - Repository name in format {owner}/{repo}
     */
    constructor(authToken, repository) {
        this.authToken = authToken
        this.repo = repository
    }

    /**
     * @private
     * @readonly
     * @type {String}
     */
    authToken

    /**
     * @readonly
     * @type {String}
     */
    repo

    get isAuthenticated() {
        return !!this.authToken
    }

    /**
     * @return {Promise<GithubUserInfo>}
     */
    getUserDetails() {
        const cached = userDetailsCache[this.authToken]
        if (cached?.expires > new Date().getTime())
            return cached.userInfo
        return this.invokeApi({
            path: `user`
        })
            .then(res => {
                const login = (res.login || '').toLowerCase()
                if (!login) return Promise.reject(new Error('Failed to authenticate a user'))
                const userInfo = {
                    id: res.id,
                    name: login,
                    title: res.name || login,
                    avatar: res.avatar_url,
                    email: res.email || `${res.login}@stellar.expert`
                }
                userDetailsCache[this.authToken] = {userInfo, expires: new Date().getTime() + 60 * 60 * 1000} //cache for one hour
                return userInfo
            })
    }

    /**
     * @param {String} [path]
     * @return {Promise<RepoContentEntry|RepoContentEntry[]>} Directory or file content
     */
    listRepoContents(path = '') {
        return this.invokeApi({
            path: `repos/${this.repo}/contents/${path}`
        })
            .then(res => {
                if (res instanceof Array)  //directory contents
                    return res.map(entry => {
                        const res = {type: entry.type === 'file' ? 'file' : 'directory', name: entry.name}
                        if (res.type === 'file') {
                            res.sha = entry.sha
                        }
                    })
                if (res.message === 'Not Found') return null
                //single file contents
                return {
                    type: 'file',
                    name: res.name,
                    content: decodeBase64(res.content),
                    sha: res.sha
                }
            })
    }

    /**
     * @param {String} path - File path
     * @param {String} content - Text file content
     * @param {String} message - Commit message
     * @param {String} [sha] - Hash of the file being replaced (for updates)
     * @param {GithubCommitAuthorInfo} author
     * @return {Promise<String>}
     */
    writeFile(path, {content, message, sha, author}) {
        const data = {content: encodeBase64(content), message}
        if (sha) {
            data.sha = sha
        }
        if (author) {
            data.author = author
        }
        return this.invokeApi({
            path: `repos/${this.repo}/contents/${path}`,
            method: 'PUT',
            data
        })
            .then(res => res.html_url)
    }

    /**
     * @param {String} path - File path
     * @param {String} message - Commit message
     * @param {String} sha - Hash of the file to delete
     * @param {GithubCommitAuthorInfo} [author] - Hash of the file to delete
     * @return {Promise<String>}
     */
    deleteFile(path, {message, sha, author}) {
        const data = {message, sha}
        if (author) {
            data.author = author
        }
        return this.invokeApi({
            path: `repos/${this.repo}/contents/${path}`,
            method: 'DELETE',
            data
        })
            .then(res => res.commit.html_url)
    }

    /**
     * @param {String} title
     * @param {String} body
     * @return {Promise<String>} Issue URL
     */
    createIssue({title, body}) {
        return this.invokeApi({
            path: `repos/${this.repo}/issues`,
            method: 'POST',
            data: {title, body}
        })
            .then(res => res.html_url)
    }

    /**
     * @return {Promise<String>} Access token to Github API
     */
    exchangeAccessToken(clientId, clientSecret, authCode) {
        return this.invokeApi({
            path: 'login/oauth/access_token',
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                code: authCode
            },
            method: 'POST',
            skipAuth: true,
            origin: 'https://github.com'
        })
    }

    /**
     * @private
     * @param {String} path - Relative URL path
     * @param {'GET'|'POST'|'PUT'|'DELETE'} [method] - HTTP method
     * @param {Object} [data] - Request query/body params
     * @param {Boolean} [skipAuth] - Skip Authorization header if set
     * @param {String} origin - API request origin
     * @return {Promise}
     */
    invokeApi({path, data, method, skipAuth = false, origin = 'https://api.github.com'}) {
        const params = {method: method || 'GET'}
        if (path.indexOf('/') !== 0) {
            path = '/' + path
        }
        params.headers = {'User-Agent': 'StellarExpert Directory Bot', Accept: 'application/vnd.github.v3+json'}
        if (!skipAuth) {
            if (!this.authToken)
                throw new Error(`Authorization: no Github access token provided`)
            params.headers.Authorization = `token ${this.authToken}`
        }
        return fetch(origin + path, data, params)
    }
}

module.exports = GithubApiWrapper

function encodeBase64(value) {
    return Buffer.from(value, 'utf-8').toString('base64')
}

function decodeBase64(value) {
    return Buffer.from(value, 'base64').toString('utf-8')
}

/**
 * @typedef {Object} RepoContentEntry
 * @param {String} name
 * @param {'file'|'directory'} type
 * @param {String} [content]
 * @param {String} [sha]
 */

/**
 * @typedef {Object} GithubUserInfo
 * @param {String} id
 * @param {String} name
 * @param {String} title
 * @param {String} avatar
 * @param {String} email
 */

/**
 * @typedef {Object} GithubCommitAuthorInfo
 * @param {String} name
 * @param {String} email
 * @param {String} [date]
 */