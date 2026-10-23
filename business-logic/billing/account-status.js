import {findPlan} from './api-plans'

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
 * Check whether a plan staff set up by hand is still in force - such a plan is changed through staff, not checkout
 * @param {{subscription: {provider: String, to: Number}}} [account]
 * @return {Boolean}
 */
export function isManagedByStaff(account) {
    const subscription = account?.subscription
    return !!subscription && subscription.provider !== 'paddle' && !(subscription.to <= Date.now())
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