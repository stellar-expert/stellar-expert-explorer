import {findPlan} from './api-plans'

/**
 * Check whether a subscription is currently serving requests
 * @param {{subscription: {to: Number}, balance: Number}} account
 * @return {Boolean}
 */
export function isSubscriptionActive(account) {
    const {subscription, balance} = account || {}
    return !!subscription && Date.now() <= subscription.to && balance > 0
}

/**
 * Check whether a customer is waiting for staff to price a custom plan
 * @param {{enterpriseRequest: {}, subscription: {plan: String}}} account
 * @return {Boolean}
 */
export function isAwaitingCustomTariff(account) {
    return !!account?.enterpriseRequest && !findPlan(account.subscription?.plan)?.custom
}