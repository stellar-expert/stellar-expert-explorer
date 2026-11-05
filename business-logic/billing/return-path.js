import {parseQuery} from '@stellar-expert/ui-framework'
import {findPlan} from './api-plans'

/**
 * Where a sign-in sends the visitor back to - the checkout of a plan picked on the pricing page, or the
 * dashboard page a session expired on
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
 * Sign-in page address that continues to the checkout of a plan picked on the pricing page
 * @param {String} plan - plan key
 * @param {'month'|'year'} period
 * @return {String}
 */
export function buildPlanSignInUrl(plan, period) {
    return `${loginPath}?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`
}

/**
 * The page the sign-in page was asked to return to - a dashboard page, or the checkout of the plan named
 * by `?plan=observer&period=month`
 * @param {String} fallback - where to go when it names none
 * @return {String}
 */
export function resolveReturnPath(fallback) {
    const {returnTo, plan, period} = parseQuery()
    if (isReturnPath(returnTo))
        return returnTo
    return buildCheckoutPath(plan, period) || fallback
}

/**
 * Checkout of a priced plan - the free one has nothing to buy, and a quoted one is arranged with the team
 * @param {String} [plan] - plan key
 * @param {String} [period] - 'month' unless 'year'
 * @return {String|null}
 * @private
 */
function buildCheckoutPath(plan, period) {
    const picked = findPlan(plan)
    if (!picked?.price)
        return null
    return `/account/subscription/checkout?plan=${picked.key}&period=${period === 'year' ? 'year' : 'month'}`
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
