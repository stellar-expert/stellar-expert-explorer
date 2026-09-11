import React, {useState} from 'react'
import cn from 'classnames'
import {Button, Tabs} from '@stellar-expert/ui-framework'
import {
    describePlanLimits, formatPrice, freePlan, maxYearlySavings, paidPlans, resolvePlanPrice
} from '../../business-logic/billing/api-plans'
import EnterpriseRequestView from '../billing/user/enterprise-request-view'
import PricingIconView from './pricing-icons-view'

/**
 * Plan catalogue with a billing period switch - the anchor target of the hero CTA
 * @return {JSX.Element}
 */
export default function PlansBlockView() {
    const [period, setPeriod] = useState('month')
    const isYearly = period === 'year'

    return <section className="subscription-block" id="plans">
        <div className="container">
            <div className="subscription-plans-header">
                <div>
                    <h2>Plans</h2>
                    <p className="subscription-plans-lead">
                        Change or cancel at any time. Unused time is credited when you upgrade.
                    </p>
                </div>
                <div className="subscription-period-switch">
                    {!!isYearly && <span className="subscription-period-savings">
                        Saving up to {maxYearlySavings}%
                    </span>}
                    <Tabs className="subscription-period-tabs" right selectedTab={period} onChange={setPeriod}
                          tabs={[{name: 'month', title: 'Monthly'}, {name: 'year', title: 'Yearly'}]}/>
                </div>
            </div>
            <div className="subscription-plan-grid">
                {paidPlans.map(plan => <PlanCard key={plan.key} plan={plan} period={period}/>)}
            </div>
            <FreePlanBar/>
            <div className="subscription-plans-note">
                Prices in USD. Pay by card or crypto through our payment processor.
                Cosmographer plans can be invoiced.
            </div>
        </div>
    </section>
}

/**
 * Published limits of a plan - a row quoting a figure highlights it, a whole phrase stands on its own
 * @param {ApiPlan} plan
 * @return {JSX.Element}
 */
function PlanLimits({plan}) {
    return <div className="subscription-plan-limits">
        {describePlanLimits(plan).map(({value, label}) => <div key={label}>
            {!!value && <span className="subscription-plan-limit-value">{value}</span>} {label}
        </div>)}
    </div>
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
                'Quoted per contract'}
        </div>
        {price.term ?
            <Button href="/account/subscription/change" block>Choose {name}</Button> :
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