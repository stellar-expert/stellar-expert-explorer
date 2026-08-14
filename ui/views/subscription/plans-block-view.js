import React, {useCallback, useState} from 'react'
import cn from 'classnames'
import {Button, ButtonGroup} from '@stellar-expert/ui-framework'
import {
    describePlanLimits, formatPrice, freePlan, paidPlans, resolvePlanPrice
} from '../../business-logic/billing/api-plans'

/**
 * Plan catalogue with a billing period switch - the anchor target of the hero CTA
 * @return {JSX.Element}
 */
export default function PlansBlockView() {
    const [period, setPeriod] = useState('month')

    const changePeriod = useCallback(e => setPeriod(e.target.dataset.period), [])

    return <section className="subscription-block" id="plans">
        <div className="container">
            <div className="dual-layout subscription-plans-header">
                <h2>Plans</h2>
                <div className="subscription-period-switch">
                    <ButtonGroup>
                        <Button small disabled={period === 'month'} data-period="month" onClick={changePeriod}>
                            Monthly
                        </Button>
                        <Button small disabled={period === 'year'} data-period="year" onClick={changePeriod}>
                            Yearly
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
            <div className="dimmed">Change or cancel at any time. Unused time is credited when you upgrade.</div>
            <div className="row space">
                {paidPlans.map(plan => <div key={plan.key} className="column column-33">
                    <PlanCard plan={plan} period={period}/>
                </div>)}
            </div>
            <FreePlanBar/>
            <div className="dimmed text-tiny micro-space">
                Prices in USD. Pay by card or crypto through our payment processor.
                Cosmographer plans can be invoiced.
            </div>
        </div>
    </section>
}

/**
 * Single paid plan
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @return {JSX.Element}
 */
const PlanCard = React.memo(function PlanCard({plan, period}) {
    const {name, icon, audience, popular} = plan
    const price = resolvePlanPrice(plan, period)
    const isYearly = period === 'year'

    return <div className={cn('card card-blank billing-card subscription-plan', {popular})}>
        {!!popular && <div className="subscription-plan-badge">most popular</div>}
        <i className={cn('subscription-plan-icon icon', icon)}/>
        <h3>{name}</h3>
        <div className="dimmed text-small subscription-plan-audience">{audience}</div>
        <div className="subscription-plan-price">
            {price.term ? <>
                {!!isYearly && <div className="dimmed text-tiny"><s>${formatPrice(price.full)}</s></div>}
                <span className="subscription-plan-amount">${formatPrice(price.term)}</span>
                <span className="dimmed">/{isYearly ? 'year' : 'month'}</span>
                <div className="dimmed text-tiny">
                    {isYearly ? `$${formatPrice(price.monthly)}/month, billed yearly` : 'Billed monthly'}
                </div>
            </> : <>
                <span className="subscription-plan-amount">Custom</span>
                <div className="dimmed text-tiny">Quoted per contract</div>
            </>}
        </div>
        {price.term ?
            <a href="/account/subscription/change" className="button button-block">Choose {name}</a> :
            <a href={`mailto:info@stellar.expert?subject=${encodeURIComponent(name + ' plan enquiry')}`}
               className="button button-block button-outline">Contact us</a>}
        <ul className="subscription-plan-limits">
            {describePlanLimits(plan).map(({value, label}) => <li key={label}>{value} {label}</li>)}
        </ul>
    </div>
})

/**
 * Free tier strip - no account to create, so it gets a row rather than a card with a CTA
 * @return {JSX.Element}
 */
function FreePlanBar() {
    const {name, icon, audience} = freePlan

    return <div className="card card-blank billing-card subscription-free space">
        <div className="row row-center">
            <div className="column subscription-free-identity">
                <i className={cn('subscription-free-icon icon', icon)}/>
                <div>
                    <h4>{name}</h4>
                    <div className="dimmed text-small">{audience}</div>
                </div>
            </div>
            <div className="column subscription-free-usage">
                <ul className="subscription-plan-limits subscription-free-limits">
                    {describePlanLimits(freePlan).map(({value, label}) => <li key={label}>{value} {label}</li>)}
                </ul>
            </div>
            <div className="column subscription-free-price text-right">
                <div className="subscription-plan-amount">Free</div>
                <div className="dimmed text-tiny">No registration required</div>
            </div>
        </div>
    </div>
}