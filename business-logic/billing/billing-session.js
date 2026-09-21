import appSettings from '../../app-settings'
import {performApiCall} from './billing-api'
import {endImpersonation, getImpersonationToken} from './impersonation'

/**
 * The signed-in session. Every call here goes to the billing server, which performs the Auth0 exchange -
 * the browser never contacts the tenant
 */

const storageKey = 'billingSession'
//refresh a little early - a request must never carry a token that expires in flight
const refreshMargin = 60_000

/**
 * @typedef {Object} StoredSession
 * @property {String} token - access token
 * @property {String} [refreshToken]
 * @property {Number} expiresAt - epoch ms
 * @property {{id: String, email: String, inactive: Boolean}} account
 */

/**
 * @type {StoredSession|null}
 * @private
 */
let current = read()

/**
 * @type {Promise<String>|null} - in-flight refresh, shared by every caller that arrives during it
 * @private
 */
let refreshing = null

/**
 * @return {StoredSession|null}
 * @private
 */
function read() {
    try {
        return JSON.parse(localStorage.getItem(storageKey)) || null
    } catch (e) {
        //unavailable in private browsing mode, or a corrupt entry
        return null
    }
}

/**
 * @param {StoredSession|null} session
 * @private
 */
function write(session) {
    current = session
    try {
        if (session) {
            localStorage.setItem(storageKey, JSON.stringify(session))
        } else {
            localStorage.removeItem(storageKey)
        }
    } catch (e) {
        console.error(e)
    }
}

/**
 * Turn what the API answered into what we keep
 * @param {{token: String, refreshToken: String, expiresIn: Number, account: {}}} res
 * @return {StoredSession}
 * @private
 */
function store({token, refreshToken, expiresIn, account}) {
    const session = {token, refreshToken, expiresAt: Date.now() + (expiresIn || 3600) * 1000, account}
    write(session)
    return session
}

/**
 * Claims of a token, unverified - for deciding what to render, never for access control
 * @param {String} [token]
 * @return {{}|null}
 */
export function decodeClaims(token) {
    const payload = token?.split('.')[1]
    if (!payload)
        return null
    try {
        //JWT payloads are base64url and unpadded, neither of which atob() accepts
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
            .padEnd(Math.ceil(payload.length / 4) * 4, '=')
        return JSON.parse(decodeURIComponent(Array.from(atob(base64), c =>
            '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')))
    } catch (e) {
        console.error(e)
        return null
    }
}

/**
 * @param {{}} res - whatever performApiCall resolved with
 * @return {{}} - the session, or a thrown error carrying the server's message
 * @private
 */
function applyOrThrow(res) {
    if (res?.error) {
        const error = new Error(res.error)
        error.status = res.status
        error.ext = res.ext
        throw error
    }
    return store(res)
}

/**
 * Sign in with an email and a password
 * @param {{email: String, password: String}} credentials
 * @return {Promise<StoredSession>}
 */
export async function logIn({email, password}) {
    return applyOrThrow(await performApiCall('auth/login', {
        method: 'POST',
        auth: false,
        params: {email, password}
    }))
}

/**
 * Register, and sign in with the same credentials
 * @param {{email: String, password: String}} credentials
 * @return {Promise<StoredSession>}
 */
export async function signUp({email, password}) {
    return applyOrThrow(await performApiCall('auth/signup', {
        method: 'POST',
        auth: false,
        params: {email, password}
    }))
}

/**
 * Replace the temporary password staff mailed with one of the customer's own choosing
 * @param {String} password
 * @return {Promise<StoredSession>}
 */
export async function setPassword(password) {
    return applyOrThrow(await performApiCall('auth/set-password', {method: 'POST', params: {password}}))
}

/**
 * Mail a password reset link. Answers the same whether or not the address is registered.
 * @param {String} email
 * @return {Promise<void>}
 */
export async function requestPasswordReset(email) {
    await performApiCall('auth/password-reset', {method: 'POST', auth: false, params: {email}})
}

/**
 * Set the password a mailed link was issued for, and sign in with it
 * @param {{token: String, password: String}} params
 * @return {Promise<StoredSession>}
 */
export async function completePasswordReset({token, password}) {
    return applyOrThrow(await performApiCall('auth/password-reset/confirm', {
        method: 'POST',
        auth: false,
        params: {token, password}
    }))
}

/**
 * End the session here and on the tenant
 * @return {Promise<void>}
 */
export async function logOut() {
    const refreshToken = current?.refreshToken
    write(null)
    endImpersonation()
    if (refreshToken) {
        await performApiCall('auth/logout', {method: 'POST', auth: false, params: {refreshToken}})
    }
}

/**
 * End the session and go back to the sign-in screen, as a full page load
 */
export function signOut() {
    logOut().finally(() => {
        window.location.href = '/login'
    })
}

/**
 * A usable access token
 * @return {Promise<String>}
 */
export async function getToken() {
    //while impersonating, the customer's token is the only one that may be sent
    const impersonation = getImpersonationToken()
    if (impersonation)
        return impersonation
    if (!current)
        throw new Error('Not signed in')
    if (current.expiresAt - refreshMargin > Date.now())
        return current.token
    if (!current.refreshToken) {
        write(null)
        throw new Error('Session expired')
    }
    //one renewal serves every caller waiting on it
    if (!refreshing) {
        refreshing = performApiCall('auth/refresh', {
            method: 'POST',
            auth: false,
            params: {refreshToken: current.refreshToken}
        })
            .then(res => {
                if (res?.error) {
                    write(null)
                    throw new Error(res.error)
                }
                //the account does not come back from a refresh
                return store({...res, account: current.account}).token
            })
            .finally(() => {
                refreshing = null
            })
    }
    return refreshing
}

/**
 * @return {StoredSession|null}
 */
export function getSession() {
    return current
}

/**
 * @return {Boolean}
 */
export function isSignedIn() {
    return !!current?.token
}

/**
 * A namespaced claim of the token requests are sent with. An impersonation token carries none of them
 * @param {String} name - claim name without the audience prefix
 * @return {*}
 * @private
 */
function claim(name) {
    const token = getImpersonationToken() || current?.token
    return decodeClaims(token)?.[`${appSettings.auth0.audience}/${name}`]
}

/**
 * Roles claimed by the current token
 * @return {String[]}
 */
export function getRoles() {
    return claim('roles') || []
}

/**
 * Whether this account is still on the temporary password staff mailed its owner
 * @return {Boolean}
 */
export function mustSetPassword() {
    return !!claim('mustSetPassword')
}