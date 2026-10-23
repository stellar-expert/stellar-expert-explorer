import {parseQuery} from '@stellar-expert/ui-framework'

/**
 * Where a sign-in sends the visitor back to - a plan picked on the pricing page, or the dashboard page a
 * session expired on
 */

const loginPath = '/login'

/**
 * Sign-in page address that returns to a dashboard page afterwards
 * @param {String} [returnTo] - path with query, the current location by default
 * @return {String}
 */
export function buildLoginUrl(returnTo = window.location.pathname + window.location.search) {
    if (!isReturnPath(returnTo))
        return loginPath
    return `${loginPath}?returnTo=${encodeURIComponent(returnTo)}`
}

/**
 * The page the sign-in page was asked to return to
 * @param {String} fallback - where to go when it names none
 * @return {String}
 */
export function resolveReturnPath(fallback) {
    const {returnTo} = parseQuery()
    return isReturnPath(returnTo) ? returnTo : fallback
}

/**
 * Only dashboard pages qualify - anything else could send a freshly signed-in visitor to another origin
 * @param {String} [path]
 * @return {Boolean}
 * @private
 */
function isReturnPath(path) {
    return typeof path === 'string' && /^\/(account|admin)([/?]|$)/.test(path)
}
