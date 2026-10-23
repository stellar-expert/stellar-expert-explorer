import React from 'react'
import cn from 'classnames'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {
    allPlans, describePlanLimits, formatPrice, resolvePlanPrice
} from '../../../business-logic/billing/api-plans'
import EnterpriseRequestView from './enterprise-request-view'

/**
 * Full catalogue with the plan in force marked, laid out for switching rather than for signing up
 * @param {String} [currentPlan] - key of the plan the account is on
 * @param {'month'|'year'} [currentTerm] - how that plan is billed, which is a separate thing to switch
 * @param {'month'|'year'} period - the term the catalogue is being priced for
 * @param {String} [highlight] - key of a plan picked before arriving here
 * @param {{message: String, all: Boolean}} [lock] - why switching to a paid plan is not possible now; `all`
 * rules out the cancellation as well
 * @param {Number} [endsAt] - when the paid plan in force ends, once its renewal is off
 * @param {Boolean} [disabled]
 * @param {Function} onSelect - receives the chosen paid plan
 * @param {Function} onCancel - asks to end the paid plan in force when its term runs out
 * @return {JSX.Element}
 */
export default function PlanSelectorView({
    currentPlan, currentTerm, period, highlight, lock, endsAt, disabled, onSelect, onCancel
}) {
    return <div className="row">
        {allPlans.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isCurrentTerm = isCurrent && (!plan.price || period === currentTerm)
            const isHighlighted = !isCurrent && plan.key === highlight
            const price = resolvePlanPrice(plan, period)
            const isYearly = period === 'year'
            return <div key={plan.key} className="column column-25">
                <div className={cn('card billing-card billing-plan-option', {
                    current: isCurrent,
                    popular: !isCurrent && (isHighlighted || (!highlight && plan.popular))
                })}>
                    {!!isCurrent && <div className="billing-plan-badge">active</div>}
                    {!!isHighlighted && <div className="billing-plan-badge popular">selected</div>}
                    {!isCurrent && !highlight && !!plan.popular &&
                        <div className="billing-plan-badge popular">popular</div>}
                    <h3>{plan.name}</h3>
                    <div className="dimmed text-tiny billing-plan-audience nano-space">{plan.audience}</div>
                    <ul className="subscription-plan-limits billing-plan-limits dimmed text-tiny">
                        {describePlanLimits(plan).map(({value, label}) => <li key={label}>
                            <span className="billing-plan-limit-value text-small">{value}</span> {label}
                        </li>)}
                    </ul>
                    <div className="billing-plan-price">
                        {plan.custom ? <>
                            <span className="subscription-plan-amount">Custom</span>
                            <div className="dimmed text-tiny">Flexible</div>
                        </> : <>
                            {!!price.term && !!isYearly && <div className="dimmed text-tiny">
                                <s>${formatPrice(price.full)}</s>
                            </div>}
                            <div>
                                <span className="subscription-plan-amount">
                                    {price.term ? `$${formatPrice(price.term)}` : 'Free'}
                                </span>
                                {!!price.term && <span className="dimmed">/{isYearly ? 'year' : 'month'}</span>}
                            </div>
                            <div className="dimmed text-tiny">
                                {!price.term ? 'No card required' : isYearly ?
                                    `$${formatPrice(price.monthly)}/month, billed yearly` :
                                    'Billed monthly'}
                            </div>
                        </>}
                    </div>
                    <PlanActionView plan={plan} isCurrent={isCurrent} isCurrentTerm={isCurrentTerm}
                                    currentPlan={currentPlan} period={period} lock={lock} endsAt={endsAt}
                                    disabled={disabled} onSelect={onSelect} onCancel={onCancel}/>
                </div>
            </div>
        })}
    </div>
}

/**
 * The one action that makes sense for this plan given the one already in force
 * @param {ApiPlan} plan
 * @param {Boolean} isCurrent - the plan the account is on, whichever way it is billed
 * @param {Boolean} isCurrentTerm - and billed the way the catalogue is currently priced
 * @param {String} [currentPlan]
 * @param {'month'|'year'} period
 * @param {{message: String, all: Boolean}} [lock]
 * @param {Number} [endsAt]
 * @param {Boolean} [disabled]
 * @param {Function} onSelect
 * @param {Function} onCancel
 * @return {JSX.Element}
 * @private
 */
function PlanActionView({
    plan, isCurrent, isCurrentTerm, currentPlan, period, lock, endsAt, disabled, onSelect, onCancel
}) {
    if (isCurrentTerm)
        return <Button block disabled>Current plan</Button>

    if (plan.custom)
        return <EnterpriseRequestView/>

    //moving to the free plan means letting the paid one lapse
    if (!plan.price) {
        if (endsAt)
            return <Button block disabled>From <UtcTimestamp date={endsAt} dateOnly/></Button>
        return <Button block disabled={disabled || lock?.all} title={lock?.all ? lock.message : undefined}
                       onClick={onCancel}>
            Cancel at period end
        </Button>
    }

    const currentIndex = allPlans.findIndex(entry => entry.key === currentPlan)
    const targetIndex = allPlans.findIndex(entry => entry.key === plan.key)
    const isDowngrade = currentIndex >= 0 && targetIndex < currentIndex

    return <Button block data-plan={plan.key} disabled={disabled || !!lock} title={lock?.message}
                   onClick={() => onSelect(plan)}>
        {isCurrent ? `Switch to ${period === 'year' ? 'yearly' : 'monthly'}` : isDowngrade ? 'Downgrade' : 'Choose'}
    </Button>
}