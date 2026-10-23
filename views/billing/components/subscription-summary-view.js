import React from 'react'
import cn from 'classnames'
import {UtcTimestamp} from '@stellar-expert/ui-framework'
import {formatDateUTC, formatWithAutoPrecision} from '@stellar-expert/formatter'
import {describePlanShort, describeSubscriptionLimits, resolveAccountPlan}
    from '../../../business-logic/billing/api-plans'
import {isAwaitingCustomTariff} from '../../../business-logic/billing/account-status'
import {describeDays, getDaysLeft} from '../utils/date-resolver'
import SubscriptionTermView from './subscription-term-view'

/**
 * Badge style per Paddle subscription status
 */
const providerStatusStyles = {
    active: 'billing-badge',
    trialing: 'billing-badge',
    past_due: 'billing-badge pending'
}

/**
 * Read-only summary of an account subscription - the plan and what it allows, how much of the paid term
 * is spent, and when it runs out
 * @param {{subscription: {}, enterpriseRequest: {}}} [account]
 */
export default function SubscriptionSummaryView({account}) {
    const {subscription, enterpriseRequest} = account || {}
    const badge = isAwaitingCustomTariff(account) ? <CustomTariffBadgeView request={enterpriseRequest}/> : null
    //no stored subscription means the free plan, which has no term and never expires
    const catalogue = resolveAccountPlan(account)
    const {from, to} = subscription || {}
    const limits = subscription ? describeSubscriptionLimits(subscription) : describePlanShort(catalogue)
    return <div className="card card-blank billing-card billing-subscription micro-space">
        <div className="dual-layout">
            <strong className="nowrap">{catalogue?.name || subscription?.plan}</strong>
            <span className="dimmed text-small nano-space nowrap">
                {limits || (catalogue?.custom ? 'Custom options' : null)}
            </span>
        </div>
        <SubscriptionTermView from={from} to={to}/>
        <div className="dual-layout">
            <div>{badge}{!!badge && !!subscription?.paddle && ' '}<ProviderBadgeView subscription={subscription}/></div>
            <span className="dimmed text-tiny text-right">
                {subscription ? <><UtcTimestamp date={to} dateOnly/>&nbsp;· {describeTerm(to)}</> : 'no expiry'}
            </span>
        </div>
    </div>
}

/**
 * Marks a subscription the customer bought and pays for through Paddle, which staff cannot edit
 * @param {{provider: String, paddle: {status: String}}} [subscription]
 * @return {JSX.Element|null}
 */
export function ProviderBadgeView({subscription}) {
    if (subscription?.provider !== 'paddle')
        return null
    const status = subscription.paddle?.status || 'active'
    return <code className={cn('text-tiny nowrap', providerStatusStyles[status] || 'billing-badge inactive')}
                 title="Paid through Paddle - the customer manages it from their dashboard">
        paddle · {status.replace(/_/g, ' ')}
    </code>
}

/**
 * Marks an account waiting for a custom plan
 * @param {{company: String, monthlyRequests: String, requested: String}} [request]
 */
function CustomTariffBadgeView({request}) {
    const hint = [
        'Custom plan requested',
        request?.company,
        request?.monthlyRequests && `${formatWithAutoPrecision(Number(request.monthlyRequests))} requests/month`,
        request?.requested && `asked ${formatDateUTC(request.requested)}`
    ].filter(Boolean).join(' · ')
    return <code className="text-tiny nowrap billing-badge pending" title={hint}>custom tariff required</code>
}

/**
 * How much of the term is left, in the words that fit the case
 * @param {Number} to
 * @return {String}
 */
function describeTerm(to) {
    if (to < Date.now())
        return 'expired'
    const daysLeft = getDaysLeft(to)
    if (!daysLeft)
        return 'last day'
    return `${describeDays(daysLeft)} left`
}
