import React, {useCallback} from 'react'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {allPlans} from '../../../business-logic/billing/api-plans'
import PlanCatalogueView from '../../pricing/plan-catalogue-view'
import EnterpriseRequestView from './enterprise-request-view'

/**
 * The pricing page catalogue with the plan in force marked, laid out for switching rather than for signing up
 * @param {String} [currentPlan] - key of the plan the account is on
 * @param {'month'|'year'} [currentTerm] - how that plan is billed, which is a separate thing to switch
 * @param {Boolean} [complimentary] - the plan in force is given away for free months, so it can still be bought
 * @param {'month'|'year'} period - the term the catalogue is being priced for
 * @param {Function} onChangePeriod
 * @param {String} [highlight] - key of a plan picked before arriving here
 * @param {{message: String, all: Boolean}} [lock] - why switching to a paid plan is not possible now; `all`
 * rules out the cancellation as well
 * @param {Number} [endsAt] - when the paid plan in force ends, once its renewal is off
 * @param {Boolean} [disabled]
 * @param {Function} onSelect - receives the chosen paid plan
 * @param {Function} onCancel - asks to end the paid plan in force when its term runs out
 * @param {*} [header] - left side of the catalogue header
 * @param {*} [children] - shown between the header and the plans
 * @return {JSX.Element}
 */
export default function PlanSelectorView({
    currentPlan, currentTerm, complimentary, period, onChangePeriod, highlight, lock, endsAt, disabled, onSelect,
    onCancel, header, children
}) {
    const markPlan = useCallback(plan => {
        if (plan.key === currentPlan)
            return {badge: 'current', current: true}
        if (plan.key === highlight)
            return {badge: 'selected', featured: true}
        //a plan picked before arriving here takes the spotlight off the popular one
        if (!highlight && plan.popular)
            return {badge: 'most popular', featured: true}
        return {}
    }, [currentPlan, highlight])

    const renderAction = plan => <PlanActionView plan={plan} currentPlan={currentPlan} currentTerm={currentTerm}
                                                 complimentary={complimentary} period={period} lock={lock}
                                                 endsAt={endsAt} disabled={disabled} onSelect={onSelect}
                                                 onCancel={onCancel}/>

    return <PlanCatalogueView header={header} period={period} onChangePeriod={onChangePeriod} markPlan={markPlan}
                              renderAction={renderAction}>
        {children}
    </PlanCatalogueView>
}

/**
 * The one action that makes sense for this plan given the one already in force
 * @param {ApiPlan} plan
 * @param {String} [currentPlan]
 * @param {'month'|'year'} [currentTerm]
 * @param {Boolean} [complimentary]
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
    plan, currentPlan, currentTerm, complimentary, period, lock, endsAt, disabled, onSelect, onCancel
}) {
    //free months of a paid plan are kept by buying that very plan
    const isCurrent = plan.key === currentPlan && !complimentary
    //the free plan is the same whichever way the catalogue is priced
    if (isCurrent && (!plan.price || period === currentTerm))
        return <Button block disabled>Current plan</Button>

    if (plan.custom)
        return <EnterpriseRequestView dialogClassName="subscription-dialog"/>

    //moving to the free plan means letting the paid one lapse
    if (!plan.price) {
        if (endsAt)
            return <Button block disabled>From <UtcTimestamp date={endsAt} dateOnly style={{overflow: 'hidden'}} /></Button>
        return <Button block disabled={disabled || lock?.all} title={lock?.all ? lock.message : undefined}
                       onClick={onCancel}>
            Cancel at period end
        </Button>
    }

    const currentIndex = allPlans.findIndex(entry => entry.key === currentPlan)
    const targetIndex = allPlans.findIndex(entry => entry.key === plan.key)

    return <Button block data-plan={plan.key} disabled={disabled || !!lock} title={lock?.message}
                   onClick={() => onSelect(plan)}>
        {isCurrent ?
            `Switch to ${period === 'year' ? 'yearly' : 'monthly'}` :
            `Choose ${plan.name}`}
    </Button>
}
