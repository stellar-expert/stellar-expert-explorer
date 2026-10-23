import React from 'react'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {findPlan, formatPrice, resolvePlanPrice} from '../../../business-logic/billing/api-plans'
import {getDaysLeft} from '../utils/date-resolver'
import SubscriptionStatusView from './subscription-status-view'
import SubscriptionTermView from './subscription-term-view'
import PlanLimitsView from './plan-limits-view'

/**
 * @typedef {Object} PaddleSubscriptionState
 * @property {String} status - as Paddle reports it: active, past_due, paused, canceled
 * @property {Number} [nextBilledAt] - when the next renewal is charged
 * @property {{action: 'cancel'|'pause'|'resume', effectiveAt: Number}|null} [scheduledChange] - a change waiting
 * for the end of the paid period
 */

/**
 * How a scheduled change reads on the card
 */
const scheduledActions = {
    cancel: 'Cancels',
    pause: 'Pauses',
    resume: 'Resumes'
}

/**
 * The plan in force - what it grants, how much of the term is left, and the two ways out of it
 * @param {{plan: String, from: Number, to: Number, autoRenew: Boolean, period: String, provider: String,
 *          paddle: PaddleSubscriptionState}} subscription
 * @param {Boolean} [isActive] - whether the plan is actually serving requests
 * @param {Function} [onToggleRenewal] - omitted where the renewal cannot be switched from this session
 * @return {JSX.Element}
 */
export default function SubscriptionCardView({subscription, isActive, onToggleRenewal}) {
    const {plan, from, to, autoRenew, period} = subscription
    const catalogue = findPlan(plan)
    const periodCost = resolvePlanPrice(catalogue || {price: null}, period).term
    const daysLeft = getDaysLeft(to)
    const isPaused = autoRenew === false

    return <div className="card card-blank billing-card billing-subscription-card">
        <div className="dual-layout">
            <h3>
                {catalogue?.name || plan}&nbsp;&nbsp;<SubscriptionStatusView isActive={isActive}/>
            </h3>
            <span className="dimmed text-small">
                {periodCost ?
                    <>${formatPrice(periodCost)}/{period === 'year' ? 'year' : 'month'} incl. tax</> :
                    'Flexible'}
            </span>
        </div>
        <PlanLimitsView limits={catalogue?.limits || subscription.limits} support={catalogue?.support}
                        custom={catalogue?.custom}/>
        <div className="dual-layout space">
            <RenewalStateView subscription={subscription}/>
            <span className="dimmed text-small nowrap">{daysLeft} days left</span>
        </div>
        <SubscriptionTermView from={from} to={to}/>
        <div className="billing-subscription-actions space">
            <Button href="/account/subscription/change">Change plan</Button>
            {!!onToggleRenewal &&
                <Button outline onClick={onToggleRenewal}>{isPaused ? 'Resume renewal' : 'Cancel renewal'}</Button>}
        </div>
    </div>
}

/**
 * What happens when the paid term runs out
 * @param {{to: Number, autoRenew: Boolean, provider: String, paddle: PaddleSubscriptionState}} subscription
 * @return {JSX.Element}
 * @private
 */
function RenewalStateView({subscription}) {
    const {to, autoRenew, paddle} = subscription
    if (paddle?.status === 'past_due')
        return <span className="color-warning">Payment overdue, service limited</span>
    if (paddle?.status === 'paused')
        return <span className="color-warning">Payments paused, service limited</span>
    const {scheduledChange, nextBilledAt} = paddle || {}
    if (scheduledChange?.effectiveAt && scheduledChange.action in scheduledActions)
        return <span>
            {scheduledActions[scheduledChange.action]} on <UtcTimestamp date={scheduledChange.effectiveAt} dateOnly/>
        </span>
    if (autoRenew === false)
        return <span>Runs until <UtcTimestamp date={to} dateOnly/></span>
    if (nextBilledAt)
        return <span>Renews on <UtcTimestamp date={nextBilledAt} dateOnly/></span>
    return <span>Renews automatically on <UtcTimestamp date={to} dateOnly/></span>
}
