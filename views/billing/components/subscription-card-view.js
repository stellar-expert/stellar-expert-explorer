import React from 'react'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {findPlan, formatPrice, resolvePlanPrice} from '../../../business-logic/billing/api-plans'
import {getDaysLeft} from '../utils/date-resolver'
import SubscriptionStatusView from './subscription-status-view'
import SubscriptionTermView from './subscription-term-view'
import PlanLimitsView from './plan-limits-view'

/**
 * The plan in force - what it grants, how much of the term is left, and the two ways out of it
 * @param {{plan: String, from: Number, to: Number, autoRenew: Boolean, period: String}} subscription
 * @param {Boolean} [isActive] - whether the plan is actually serving requests
 * @param {Function} [onToggleRenewal]
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
                    <>${formatPrice(periodCost)}/{period === 'year' ? 'year' : 'month'}</> :
                    'Quoted per contract'}
            </span>
        </div>
        <PlanLimitsView limits={catalogue?.limits || subscription.limits} support={catalogue?.support}
                        custom={catalogue?.custom}/>
        <div className="dual-layout space">
            <span>
                {isPaused ? 'Runs until' : 'Renews automatically on'} <UtcTimestamp date={to} dateOnly/>
            </span>
            <span className="dimmed text-small nowrap">{daysLeft} days left</span>
        </div>
        <SubscriptionTermView from={from} to={to}/>
        <div className="billing-subscription-actions space">
            <Button href="/account/subscription/change">Change plan</Button>
            <Button outline onClick={onToggleRenewal}>{isPaused ? 'Resume renewal' : 'Cancel renewal'}</Button>
        </div>
    </div>
}