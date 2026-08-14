import React from 'react'
import {UtcTimestamp} from '@stellar-expert/ui-framework'
import {formatDateUTC, formatWithAutoPrecision} from '@stellar-expert/formatter'
import {describeSubscriptionLimits, findPlan} from '../../../business-logic/billing/api-plans'
import {isAwaitingCustomTariff} from '../../../business-logic/billing/account-status'
import {describeDays, getDaysLeft} from '../utils/date-resolver'
import SubscriptionTermView from './subscription-term-view'

/**
 * Read-only summary of an account subscription - the plan and what it allows, how much of the paid term
 * is spent, and when it runs out
 * @param {{subscription: {}, enterpriseRequest: {}}} [account]
 */
export default function SubscriptionSummaryView({account}) {
    const {subscription, enterpriseRequest} = account || {}
    const badge = isAwaitingCustomTariff(account) ? <CustomTariffBadgeView request={enterpriseRequest}/> : null

    if (!subscription)
        return <div className="micro-space">
            <div className="dimmed">No active subscription</div>
            {!!badge && <div className="nano-space">{badge}</div>}
        </div>

    const {plan, from, to} = subscription
    const catalogue = findPlan(plan)
    return <div className="card card-blank billing-card billing-subscription micro-space">
        <div className="dual-layout">
            <strong className="nowrap">{catalogue?.name || plan}</strong>
            <span className="dimmed text-small nano-space nowrap">
                {describeSubscriptionLimits(subscription) || (catalogue?.custom ? 'Custom options' : null)}
            </span>
        </div>
        <SubscriptionTermView from={from} to={to}/>
        <div className="dual-layout">
            <div>{badge}</div>
            <span className="dimmed text-tiny text-right">
                <UtcTimestamp date={to} dateOnly/>&nbsp;· {describeTerm(to)}
            </span>
        </div>
    </div>
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