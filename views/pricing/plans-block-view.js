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

/**
 * Single paid plan
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @return {JSX.Element}
 */
const PlanCard = React.memo(function PlanCard({plan, period}) {
    const {key, name, audience, popular, custom} = plan
    const price = resolvePlanPrice(plan, period)
    const isYearly = period === 'year'

    return <div className={cn('subscription-plan', {popular, custom})}>
        <div className="subscription-plan-accent"/>
        {!!popular && <span className="subscription-plan-badge">most popular</span>}
        <div className="subscription-plan-icon">
            <PricingIconView name={key}/>
        </div>
        <div className="subscription-plan-name">{name}</div>
        <div className="subscription-plan-audience">{audience}</div>
        <div className="subscription-plan-strike">
            {!!price.term && !!isYearly && <s>${formatPrice(price.full)}</s>}
        </div>
        <div className="subscription-plan-amount">
            {price.term ? <>${formatPrice(price.term)}<span> /{isYearly ? ' year' : ' month'}</span></> : 'Custom'}
        </div>
        <div className="subscription-plan-note">
            {price.term ?
                (isYearly ? `$${formatPrice(price.monthly)} / month, billed yearly` : 'Billed monthly') :
                'Flexible'}
        </div>
        {price.term ?
            <Button href="#" block>Choose {name}</Button> :
            <EnterpriseRequestView dialogClassName="subscription-dialog"/>}
        <div className="subscription-plan-separator"/>
        <PlanLimits plan={plan}/>
    </div>
})

/**
 * Free tier strip - no account to create, so it gets a row rather than a card with a CTA
 * @return {JSX.Element}
 */
function FreePlanBar() {
    const {key, name, audience} = freePlan

    return <div className="subscription-free">
        <div className="subscription-free-identity">
            <span className="subscription-free-icon"><PricingIconView name={key}/></span>
            <div>
                <div className="subscription-plan-name">{name}</div>
                <div className="subscription-plan-audience">{audience}</div>
            </div>
        </div>
        <PlanLimits plan={freePlan}/>
        <div className="subscription-free-price">
            <div className="subscription-plan-amount">Free</div>
            <div className="subscription-free-registration">No registration required</div>
        </div>
    </div>
}