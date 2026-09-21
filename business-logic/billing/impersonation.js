/**
 * Admin "log in as" token - the identity of every dashboard request while it is stored
 */

const storageKey = 'loginAsToken'

/**
 * @return {String|null}
 */
export function getImpersonationToken() {
    try {
        return localStorage.getItem(storageKey) || null
    } catch (e) {
        //unavailable in private browsing mode
        return null
    }
}

/**
 * @return {Boolean}
 */
export function isImpersonating() {
    return !!getImpersonationToken()
}

/**
 * @param {String} token - as issued by `auth/login-as`
 */
export function startImpersonation(token) {
    try {
        localStorage.setItem(storageKey, token)
    } catch (e) {
        console.error(e)
    }
}

/**
 * Drop the impersonation token
 */
export function endImpersonation() {
    try {
        localStorage.removeItem(storageKey)
    } catch (e) {
        console.error(e)
    }
}