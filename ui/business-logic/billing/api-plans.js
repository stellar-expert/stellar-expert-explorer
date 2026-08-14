import {formatWithAbbreviation, formatWithAutoPrecision} from '@stellar-expert/formatter'

/**
 * Public API plan catalogue - the single vocabulary the whole dashboard speaks, from the /subscription
 * landing to the admin plan picker. It mirrors the server's own catalogue in `src/api-plans.js`, which is
 * the authority: a preset plan is stored with the limits published there, whatever a client sends.
 *
 * A stored subscription still keeps `monthlyCredits` and `rpsLimit` - the gateways read those fields, so
 * they are converted here (`toStoredLimits`, `describeSubscriptionLimits`) rather than renamed.
 */

/**
 * @typedef {Object} PlanLimits
 * @property {Number|null} photons - monthly allowance; null on a quoted plan, 0 when there is none
 * @property {Number|null} requestsPerMinute
 * @property {Number|null} batchSize - max items in a batch response
 */

/**
 * @typedef {Object} ApiPlan
 * @property {String} key
 * @property {String} name
 * @property {String} icon - framework icon class
 * @property {String} audience
 * @property {Number|null} price - monthly price in USD; 0 when free, null when quoted per contract
 * @property {PlanLimits} limits
 * @property {String} support
 * @property {Boolean} [custom] - limits are agreed per customer rather than published
 * @property {Boolean} [popular]
 */

/**
 * @typedef {Object} ApiPlanPrice
 * @property {Number|null} term - what one term costs, and what falls due when it renews
 * @property {Number|null} monthly - the monthly rate that works out to, for comparing terms against each other
 * @property {Number|null} full - undiscounted cost of the term: twelve months of it, on a yearly term
 * @property {Number} savings - whole percent the term saves against `full`, 0 on a monthly one
 */

/**
 * @type {ApiPlan}
 */
export const freePlan = {
    key: 'stargazer',
    name: 'Stargazer',
    icon: 'icon-star',
    audience: 'Free public endpoints for experiments and hobby projects',
    price: 0,
    limits: {photons: 0, requestsPerMinute: 60, batchSize: 25},
    support: 'Community'
}

/**
 * @type {ApiPlan[]}
 */
export const paidPlans = [
    {
        key: 'observer',
        name: 'Observer',
        icon: 'icon-zoom-in',
        audience: 'For production apps with steady traffic',
        price: 90,
        yearlyPrice: 750,
        limits: {photons: 10_000, requestsPerMinute: 600, batchSize: 200},
        support: 'Email'
    },
    {
        key: 'astronomer',
        name: 'Astronomer',
        icon: 'icon-bright-star',
        audience: 'For data-heavy services, indexers and dashboards',
        price: 160,
        yearlyPrice: 1_300,
        limits: {photons: 50_000, requestsPerMinute: 1_800, batchSize: 1_000},
        support: 'Email',
        popular: true
    },
    {
        key: 'cosmographer',
        name: 'Cosmographer',
        icon: 'icon-spiral',
        audience: 'Fully customizable limits, dedicated capacity and SLA',
        price: null,
        yearlyPrice: null,
        limits: {photons: null, requestsPerMinute: null, batchSize: null},
        support: 'Priority',
        custom: true
    }
]

/**
 * Every plan a customer can move between, cheapest first
 * @type {ApiPlan[]}
 */
export const allPlans = [freePlan, ...paidPlans]

/**
 * @param {String} key
 * @return {ApiPlan|undefined}
 */
export function findPlan(key) {
    return allPlans.find(plan => plan.key === key)
}

/**
 * Everything a card needs to quote one term of a plan
 * @param {ApiPlan} plan
 * @param {'month'|'year'} [period]
 * @return {ApiPlanPrice} - the figures are null for a free plan and for one quoted per contract alike
 */
export function resolvePlanPrice({price, yearlyPrice}, period = 'month') {
    if (!price)
        return {term: price, monthly: price, full: price, savings: 0}
    if (period !== 'year')
        return {term: price, monthly: price, full: price, savings: 0}
    const full = price * 12
    return {
        term: yearlyPrice,
        //cents matter here - a year divided by twelve rarely lands on a whole dollar
        monthly: Math.round(yearlyPrice / 12 * 100) / 100,
        full,
        //rounded down, so the figure advertised is never more than the discount actually given
        savings: Math.floor((1 - yearlyPrice / full) * 100)
    }
}

/**
 * The best yearly saving in the catalogue - what a "save up to" line advertises
 * @type {Number}
 */
export const maxYearlySavings = Math.max(...paidPlans.map(plan => resolvePlanPrice(plan, 'year').savings))

/**
 * A price as it is quoted: whole dollars stay whole, a monthly rate derived from a year keeps its cents
 * @param {Number} amount
 * @return {String}
 */
export function formatPrice(amount) {
    return amount % 1 ? amount.toFixed(2) : formatWithAutoPrecision(amount)
}

/**
 * Limits of a catalogue plan in the shape a stored subscription keeps them
 * @param {ApiPlan} plan
 * @return {{monthlyCredits: Number, rpsLimit: Number}|null} - null when they are agreed per customer, which
 * leaves whatever staff entered by hand alone
 */
export function toStoredLimits({limits, custom}) {
    if (custom)
        return null
    return {
        monthlyCredits: limits.photons || 0,
        rpsLimit: limits.requestsPerMinute ? Math.round(limits.requestsPerMinute / 60) : 0
    }
}

/**
 * Compact form of what a subscription allows
 * @param {{monthlyCredits: Number, rpsLimit: Number}} subscription
 * @return {String} - empty when the record carries no limits at all
 */
export function describeSubscriptionLimits({monthlyCredits, rpsLimit}) {
    const parts = []
    if (monthlyCredits) {
        parts.push(`${formatWithAbbreviation(monthlyCredits)}/mo`)
    }
    if (rpsLimit) {
        parts.push(`${formatWithAutoPrecision(rpsLimit * 60)} req/min`)
    }
    return parts.join(' · ')
}

/**
 * One line naming what a catalogue plan grants, for a picker that has no room for the full list
 * @param {ApiPlan} plan
 * @return {String}
 */
export function describePlanShort(plan) {
    const stored = toStoredLimits(plan)
    return stored ? describeSubscriptionLimits(stored) : 'Custom options'
}

/**
 * Format one limit for display - a quoted plan advertises "Custom", an absent allowance shows a dash
 * @param {Number|null} value
 * @param {Boolean} [custom]
 * @return {String}
 * @private
 */
function describeLimit(value, custom) {
    if (custom)
        return 'Custom'
    if (!value)
        return '—'
    return formatWithAutoPrecision(value)
}

/**
 * The published limits of a plan, as the lines shown on a plan card
 * @param {ApiPlan} plan
 * @return {{value: String, label: String}[]}
 */
export function describePlanLimits({limits, support, custom}) {
    return [
        {value: describeLimit(limits.photons, custom), label: 'photons/month'},
        {value: describeLimit(limits.requestsPerMinute, custom), label: 'requests/minute'},
        {value: describeLimit(limits.batchSize, custom), label: 'items per batch response'},
        {value: support, label: 'support'}
    ]
}