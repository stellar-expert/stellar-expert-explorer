/**
 * Request types recorded by the billing server
 */
export const requestTypeTitles = {
    charge: 'Charge',
    rejected: 'Rejected',
    payment: 'Payment',
    deposit: 'Added deposit',
    burn: 'Burned balance',
    'subscription-renewed': 'Subscription renewed',
    'subscription-changed': 'Subscription changed',
    'subscription-expired': 'Subscription ended'
}

/**
 * Row modifier per request type - a log table paints both the type text and the row edge from it, so one
 * color carries the meaning of the entry. Anything routine is left out and keeps the default
 */
export const requestTypeStyles = {
    rejected: 'log-alert',
    payment: 'log-success',
    deposit: 'log-success',
    burn: 'log-warning',
    'subscription-expired': 'log-warning'
}

/**
 * Why the gateway turned a request away - carried in `data.reason` of a `rejected` entry
 */
export const rejectionReasonTitles = {
    'rate-limit': 'rate limit exceeded',
    'insufficient-credits': 'not enough credits',
    'invalid-key': 'invalid API key'
}