import appSettings from '../../app-settings'

//key prefix used by auth0-spa-js when cacheLocation is set to "localstorage"
const auth0CachePrefix = '@@auth0spajs@@'

/**
 * Check whether an Auth0 session may exist locally, without loading the Auth0 SDK.
 * Lets the explorer skip mounting Auth0Provider (and its /authorize round-trip) for anonymous visitors.
 * @return {boolean}
 */
export function hasAuth0Session() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i)?.startsWith(auth0CachePrefix))
                return true
        }
    } catch (e) {
        //localStorage may be unavailable in private browsing mode
        console.error(e)
    }
    return false
}

/**
 * Check whether the signed-in account holds the admin role, reading the claim from the ID token that
 * auth0-spa-js already cached. The header renders on every page of the explorer, so it cannot afford to
 * mount the Auth0 SDK merely to find out who is looking
 * @return {boolean}
 */
export function hasAdminRole() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            //an account with no roles claim anywhere is an ordinary user
            if (key?.startsWith(auth0CachePrefix) && readCachedRoles(key).includes('admin'))
                return true
        }
    } catch (e) {
        console.error(e)
    }
    return false
}

/**
 * Roles claimed by a single auth0-spa-js cache entry
 * @param {String} key - localStorage key of the entry to read
 * @return {String[]}
 * @private
 */
function readCachedRoles(key) {
    try {
        const entry = JSON.parse(localStorage.getItem(key))
        const source = entry?.body || entry
        //the SDK caches the decoded claims alongside the token, which saves decoding it again here
        const claims = source?.decodedToken?.claims || decodeTokenClaims(source?.id_token)
        return claims?.[appSettings.auth0.audience + '/roles'] || []
    } catch (e) {
        //one unreadable entry must not stop the scan - the roles may be in the next one
        console.error(e)
        return []
    }
}

/**
 * Read the payload of a JWT without verifying it - fine for deciding what to render, never for access
 * control, which happens server-side against the tenant JWKS
 * @param {String} [token] - encoded JWT, as cached by auth0-spa-js
 * @return {Object|null}
 * @private
 */
function decodeTokenClaims(token) {
    const payload = token?.split('.')[1]
    if (!payload)
        return null
    //JWT payloads are base64url and unpadded, neither of which atob() accepts
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    //claims may carry non-ASCII characters
    const json = decodeURIComponent(Array.from(atob(base64), c =>
        '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''))
    return JSON.parse(json)
}

/**
 * Check whether an admin "log in as" impersonation session is active
 * @return {boolean}
 */
export function hasImpersonationSession() {
    try {
        return !!localStorage.getItem('loginAsToken')
    } catch (e) {
        console.error(e)
        return false
    }
}

/**
 * Drop the local Auth0 session cache and redirect to the Auth0 logout endpoint
 */
export function logOutFromBilling() {
    try {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(auth0CachePrefix)) {
                localStorage.removeItem(key)
            }
        }
        localStorage.removeItem('loginAsToken')
    } catch (e) {
        console.error(e)
    }
    const {domain, clientId} = appSettings.auth0
    const returnTo = encodeURIComponent(window.location.origin)
    window.location.href = `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`
}