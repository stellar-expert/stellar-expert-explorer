import React from 'react'
import cn from 'classnames'
import {Tabs} from '@stellar-expert/ui-framework'
import {
    describePlanLimits, formatPrice, freePlan, maxYearlySavings, paidPlans, resolvePlanPrice
} from '../../business-logic/billing/api-plans'
import PricingIconView from './pricing-icons-view'
import './plan-catalogue.scss'

/**
 * @typedef {Object} PlanMark
 * @property {String} [badge] - caption in the corner of the card
 * @property {Boolean} [featured] - lifts the card above the rest
 * @property {Boolean} [current] - the plan the account is on
 */

const periodTabs = [{name: 'month', title: 'Monthly'}, {name: 'year', title: 'Yearly'}]

/**
 * Paid plan cards and the free tier strip under a billing period switch. The pricing page sells from it and
 * the dashboard switches plans with it, so the host decides what each plan offers to do
 * @param {*} [header] - left side of the header, opposite the period switch
 * @param {'month'|'year'} period
 * @param {Function} onChangePeriod
 * @param {Function} renderAction - receives a plan, returns its call to action
 * @param {Function} [markPlan] - receives a plan, returns its {@link PlanMark}
 * @param {*} [children] - shown between the header and the plans
 * @return {JSX.Element}
 */
export default function PlanCatalogueView({
                                              header, period, onChangePeriod, renderAction, markPlan = markPopular, children
                                          }) {
    return <div className="subscription-catalogue">
        <div className="subscription-plans-header">
            <div>{header}</div>
            <div className="subscription-period-switch">
                <span className="subscription-period-savings">Save up to {maxYearlySavings}% yearly</span>
                <Tabs className="subscription-period-tabs" right selectedTab={period} onChange={onChangePeriod}
                      tabs={periodTabs}/>
            </div>
        </div>
        {children}
        <div className="subscription-plan-grid">
            {paidPlans.map(plan => <PlanCard key={plan.key} plan={plan} period={period} mark={markPlan(plan)}
                                             action={renderAction(plan)}/>)}
        </div>
        <FreePlanBar mark={markPlan(freePlan)} action={renderAction(freePlan)}/>
    </div>
}

/**
 * The mark a catalogue shows with nothing else to point out
 * @param {ApiPlan} plan
 * @return {PlanMark}
 * @private
 */
function markPopular(plan) {
    return plan.popular ? {badge: 'most popular', featured: true} : {}
}

/**
 * @param {PlanMark} mark
 * @return {JSX.Element|null}
 * @private
 */
function PlanBadge({mark}) {
    if (!mark.badge)
        return null
    return <span className={cn('subscription-plan-badge', {current: mark.current})}>{mark.badge}</span>
}

/**
 * Published limits of a plan - a row quoting a figure highlights it, a whole phrase stands on its own
 * @param {ApiPlan} plan
 * @return {JSX.Element}
 * @private
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
 * @param {PlanMark} mark
 * @param {*} action
 * @return {JSX.Element}
 * @private
 */
function PlanCard({plan, period, mark, action}) {
    const {key, name, audience, custom} = plan
    const price = resolvePlanPrice(plan, period)
    const isYearly = period === 'year'

    return <div className={cn('subscription-plan', {featured: mark.featured, current: mark.current, custom})}>
        <div className="subscription-plan-accent"/>
        <PlanBadge mark={mark}/>
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
        <div className="micro-space"/>
        {action}
        <div className="subscription-plan-separator"/>
        <PlanLimits plan={plan}/>
    </div>
}

/**
 * Free tier strip - it costs nothing in either period, so it gets a row rather than a card
 * @param {PlanMark} mark
 * @param {*} action
 * @return {JSX.Element}
 * @private
 */
function FreePlanBar({mark, action}) {
    const {key, name, audience} = freePlan

    return <div className={cn('subscription-free', {current: mark.current})}>
        <PlanBadge mark={mark}/>
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
            {action}
        </div>
    </div>
}
