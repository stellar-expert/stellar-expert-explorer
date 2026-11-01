import {performApiCall} from './billing-api'
import {endImpersonation, getImpersonationToken} from './impersonation'

/**
 * The signed-in session. Signing in is passwordless: the billing server mails a link, and the token it
 * carries is traded here for a session token
 */

const storageKey = 'billingSession'

/**
 * @typedef {Object} StoredSession
 * @property {String} token - session token
 * @property {Number} expiresAt - epoch ms
 * @property {{id: String, email: String, inactive: Boolean}} account
 */

/**
 * @type {StoredSession|null}
 * @private
 */
let current = read()

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
 * Call back once another tab signs in - the one the mailed link was opened in
 * @param {Function} callback - receives the session that tab stored
 * @return {Function} - stops watching
 */
export function onSignInElsewhere(callback) {
    const listener = e => {
        if (e.key !== storageKey || !e.newValue)
            return
        current = read()
        if (current) {
            callback(current)
        }
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
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
 * @return {{}} - the answer, or a thrown error carrying the server's message
 * @private
 */
function unwrap(res) {
    if (res?.error) {
        const error = new Error(res.error)
        error.status = res.status
        error.ext = res.ext
        throw error
    }
    return res
}

/**
 * Mail a sign-in link. The same for a new address and a registered one - following the link creates
 * the account
 * @param {{email: String, returnTo: String}} params - returnTo: dashboard page to open once signed in
 * @return {Promise<void>}
 */
export async function requestSignInLink({email, returnTo}) {
    unwrap(await performApiCall('auth/link', {method: 'POST', auth: false, params: {email, returnTo}}))
}

/**
 * Trade the token of a mailed link for a session
 * @param {String} token
 * @return {Promise<StoredSession>}
 */
export async function completeSignIn(token) {
    const {token: sessionToken, expiresIn, account} = unwrap(await performApiCall('auth/verify', {
        method: 'POST',
        auth: false,
        params: {token}
    }))
    const session = {token: sessionToken, expiresAt: Date.now() + expiresIn * 1000, account}
    write(session)
    return session
}

/**
 * End the session in this browser - a session token is not kept anywhere else
 * @return {Promise<void>}
 */
export async function logOut() {
    write(null)
    endImpersonation()
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
 * A usable session token
 * @return {Promise<String>}
 */
export async function getToken() {
    //while impersonating, the customer's token is the only one that may be sent
    const impersonation = getImpersonationToken()
    if (impersonation)
        return impersonation
    if (!current)
        throw new Error('Not signed in')
    if (current.expiresAt > Date.now())
        return current.token
    write(null)
    throw new Error('Session expired')
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
 * Roles claimed by the token requests are sent with. An impersonation token carries none
 * @return {String[]}
 */
export function getRoles() {
    return decodeClaims(getImpersonationToken() || current?.token)?.roles || []
}
