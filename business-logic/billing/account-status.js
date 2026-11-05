import {findPlan, freePlan} from './api-plans'

/**
 * Check whether a subscription is currently serving requests
 * @param {{subscription: {to: Number}, entitlement: {throttled: Boolean}, balance: Number}} account
 * @return {Boolean}
 */
export function isSubscriptionActive(account) {
    const {subscription, entitlement, balance} = account || {}
    if (!subscription)
        return false
    //the server knows about grace periods and plans without an allowance, so its verdict wins
    if (entitlement)
        return !entitlement.throttled
    return Date.now() <= subscription.to && balance > 0
}

/**
 * Check whether an account is on the free plan - with no plan of its own (an ended plan is dropped from the
 * account, not kept), or with the free one staff put it on
 * @param {{subscription: {plan: String}}} [account]
 * @return {Boolean}
 */
export function isOnFreePlan(account) {
    if (!account)
        return false
    const plan = account.subscription?.plan
    return !plan || plan === freePlan.key
}

/**
 * Check whether a new API key can be issued - it takes a paid plan inside its term, renewal grace included,
 * which only the server can tell
 * @param {{entitlement: {inPaidTerm: Boolean}}} [account]
 * @return {Boolean}
 */
export function canIssueApiKeys(account) {
    return !!account?.entitlement?.inPaidTerm
}

/**
 * Check whether a new origin can be added - it takes a plan with origin access inside its paid term, as the
 * server tells
 * @param {{entitlement: {originAccess: Boolean}}} [account]
 * @return {Boolean}
 */
export function canAddOrigins(account) {
    return !!account?.entitlement?.originAccess
}

/**
 * Check whether a plan staff set up by hand is still in force - such a plan is changed through staff, not
 * checkout. The free plan and free months of a paid one are not: checkout replaces them
 * @param {{subscription: {provider: String, plan: String, to: Number, complimentary: Boolean}}} [account]
 * @return {Boolean}
 */
export function isManagedByStaff(account) {
    const subscription = account?.subscription
    return !!subscription && subscription.provider !== 'paddle' && subscription.plan !== freePlan.key &&
        !subscription.complimentary && !(subscription.to <= Date.now())
}

/**
 * Check whether the plan in force is a paid one given away for free months
 * @param {{subscription: {complimentary: Boolean}}} [account]
 * @return {Boolean}
 */
export function isOnFreeMonths(account) {
    return !!account?.subscription?.complimentary
}

/**
 * Check whether the subscription renewal payment failed and is being retried
 * @param {{subscription: {paddle: {status: String}}}} [account]
 * @return {Boolean}
 */
export function isPaymentOverdue(account) {
    return account?.subscription?.paddle?.status === 'past_due'
}

/**
 * Check whether a customer is waiting for staff to price a custom plan
 * @param {{enterpriseRequest: {}, subscription: {plan: String}}} account
 * @return {Boolean}
 */
export function isAwaitingCustomTariff(account) {
    return !!account?.enterpriseRequest && !findPlan(account.subscription?.plan)?.custom
}