import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {buildPlanSignInUrl} from '../../business-logic/billing/return-path'
import EnterpriseRequestView from '../billing/user/enterprise-request-view'
import PlanCatalogueView from './plan-catalogue-view'
import ComputeUnitsBlockView from './compute-units-block-view'
import AgentsBlockView from './agents-block-view'

/**
 * Plan catalogue with a billing period switch - the anchor target of the hero CTA
 * @return {JSX.Element}
 */
export default function PlansBlockView() {
    const [period, setPeriod] = useState('month')
    const renderAction = useCallback(plan => renderPlanAction(plan, period), [period])

    return <section className="subscription-block subscription-plans-block" id="plans">
        <div className="container">
            <PlanCatalogueView period={period} onChangePeriod={setPeriod} renderAction={renderAction} header={<>
                <div className="subscription-block-eyebrow">/ API plans</div>
                <h2>From weekend prototypes <br/>to mission-critical systems</h2>
            </>}/>
            <div className="subscription-plans-note">
                Prices in USD, taxes included. Pay by card, PayPal, Apple Pay or Google Pay.
                Cosmographer plans can be invoiced.
            </div>
            <ComputeUnitsBlockView/>
            <AgentsBlockView/>
        </div>
    </section>
}

/**
 * What the landing offers for a plan
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period - billing period picked on the switch
 * @return {JSX.Element}
 */
function renderPlanAction(plan, period) {
    if (plan.custom)
        return <EnterpriseRequestView dialogClassName="subscription-dialog"/>
    //no account to create for the free tier
    if (!plan.price)
        return <div className="subscription-free-registration">No registration required</div>
    //sign-in continues to the checkout of this plan, at once for a visitor already signed in
    return <Button href={buildPlanSignInUrl(plan.key, period)} block>
        Choose {plan.name}
    </Button>
}
