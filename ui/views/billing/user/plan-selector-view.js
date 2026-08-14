import React from 'react'
import cn from 'classnames'
import {Button} from '@stellar-expert/ui-framework'
import {
    allPlans, describePlanLimits, formatPrice, resolvePlanPrice
} from '../../../business-logic/billing/api-plans'
import EnterpriseRequestView from './enterprise-request-view'

/**
 * Full catalogue with the plan in force marked, laid out for switching rather than for signing up
 * @param {String} [currentPlan] - key of the plan the account is on
 * @param {'month'|'year'} [currentTerm] - how that plan is billed, which is a separate thing to switch
 * @param {'month'|'year'} period - the term the catalogue is being priced for
 * @param {Function} onSelect - receives the chosen plan
 * @return {JSX.Element}
 */
export default function PlanSelectorView({currentPlan, currentTerm, period, onSelect}) {
    return <div className="row">
        {allPlans.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isCurrentTerm = isCurrent && (!plan.price || period === currentTerm)
            const price = resolvePlanPrice(plan, period)
            const isYearly = period === 'year'
            return <div key={plan.key} className="column column-25">
                <div className={cn('card billing-card billing-plan-option', {
                    current: isCurrent,
                    popular: !isCurrent && plan.popular
                })}>
                    {!!isCurrent && <div className="billing-plan-badge">active</div>}
                    {!isCurrent && !!plan.popular && <div className="billing-plan-badge popular">popular</div>}
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
                            <div className="dimmed text-tiny">Quoted per contract</div>
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
                                    currentPlan={currentPlan} period={period} onSelect={onSelect}/>
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
 * @param {Function} onSelect
 * @return {JSX.Element}
 * @private
 */
function PlanActionView({plan, isCurrent, isCurrentTerm, currentPlan, period, onSelect}) {
    if (isCurrentTerm)
        return <Button block disabled>Current plan</Button>

    if (isCurrent)
        return <Button block data-plan={plan.key} onClick={() => onSelect(plan)}>
            Switch to {period === 'year' ? 'yearly' : 'monthly'}
        </Button>

    if (plan.custom)
        return <EnterpriseRequestView/>

    const currentIndex = allPlans.findIndex(entry => entry.key === currentPlan)
    const targetIndex = allPlans.findIndex(entry => entry.key === plan.key)
    const isDowngrade = currentIndex >= 0 && targetIndex < currentIndex

    return <Button block data-plan={plan.key} onClick={() => onSelect(plan)}>
        {isDowngrade ? 'Downgrade' : 'Choose'}
    </Button>
}