import React, {useCallback, useState} from 'react'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {isSubscriptionActive} from '../../../business-logic/billing/account-status'
import {describePlanShort, findPlan, formatPrice, freePlan, resolvePlanPrice}
    from '../../../business-logic/billing/api-plans'
import {useSession} from '../auth/auth-session'
import {confirmAction} from '../utils/confirm-action'
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
 * The plan an account is on - what it grants, how much of the term is left, and the ways to change it. The
 * owner and staff get the same card, each linked to their own plan editor
 * @param {{id: String, subscription: {}, entitlement: {}, balance: Number}} [account]
 * @param {Function} onUpdate - receives a state updater for the account once the renewal is switched
 * @param {String} [changeLink] - where the plan is changed
 * @param {String} [changeTitle] - caption of that link
 * @param {Boolean} [disabled]
 * @return {JSX.Element}
 */
export default function SubscriptionCardView({
                                                 account, onUpdate, changeLink = '/account/subscription/change', changeTitle = 'Change plan', disabled
                                             }) {
    const {impersonated} = useSession()
    const [isProgress, setIsProgress] = useState(false)
    const subscription = account?.subscription
    const isPaused = subscription?.autoRenew === false

    const toggleRenewal = useCallback(async () => {
        const planName = findPlan(subscription.plan)?.name || subscription.plan
        const end = <UtcTimestamp date={subscription.to} dateOnly/>
        if (!await confirmAction(isPaused ?
            <>Are you sure that you want to Resume automatic renewal? "{planName}" renews on {end} and is billed for the next term.</> :
            <>Are you sure that you want to Cancel automatic renewal? "{planName}" stays active until {end}, no further charges.</>))
            return
        setIsProgress(true)
        apiRequest(`account/${account.id}/subscription/renewal`, {method: 'POST', params: {autoRenew: isPaused}})
            .then(res => {
                onUpdate(prev => ({...prev, subscription: res.subscription}))
                notify({type: 'success', message: `Automatic renewal has been ${isPaused ? 'resumed' : 'cancelled'}`})
            })
            .catch(error => notify({type: 'error', message: 'Failed to update renewal. ' + error?.message}))
            .finally(() => setIsProgress(false))
    }, [account, subscription, isPaused, onUpdate])

    if (!subscription)
        return <FreePlanView changeLink={changeLink} changeTitle={changeTitle}/>

    const {plan, from, to, period} = subscription
    const catalogue = findPlan(plan)
    const periodCost = resolvePlanPrice(catalogue || {price: null}, period).term
    //Paddle takes changes to what it bills from the owner only, never from staff logged in as them, and free
    //months end with their term whatever is set
    const canToggleRenewal = !(impersonated && subscription.provider === 'paddle') && !subscription.complimentary

    return <div className="card card-blank billing-card billing-subscription-card">
        <div className="dual-layout">
            <h3>
                {catalogue?.name || plan}&nbsp;&nbsp;<SubscriptionStatusView isActive={isSubscriptionActive(account)}/>
            </h3>
            <span className="dimmed text-small">
                {subscription.complimentary ? 'Free months' : periodCost ?
                    <>${formatPrice(periodCost)}/{period === 'year' ? 'year' : 'month'} incl. tax</> :
                    'Flexible'}
            </span>
        </div>
        <PlanLimitsView limits={catalogue?.limits || subscription.limits} support={catalogue?.support}
                        custom={catalogue?.custom}/>
        <div className="dual-layout space">
            <RenewalStateView subscription={subscription}/>
            <span className="dimmed text-small nowrap">{getDaysLeft(to)} days left</span>
        </div>
        <SubscriptionTermView from={from} to={to}/>
        <div className="billing-subscription-actions space row">
            <div className="column column-50"></div>
            <div className="column column-25">
                <Button block href={changeLink}>{changeTitle}</Button>
            </div>
            <div className="column column-25">
                {canToggleRenewal && <Button block outline disabled={disabled || isProgress} onClick={toggleRenewal}>
                    {isPaused ? 'Resume renewal' : 'Cancel renewal'}
                </Button>}
            </div>
        </div>
    </div>
}

/**
 * What happens when the paid term runs out
 * @param {{to: Number, autoRenew: Boolean, complimentary: Boolean, provider: String, paddle: PaddleSubscriptionState}} subscription
 * @return {JSX.Element}
 * @private
 */
function RenewalStateView({subscription}) {
    const {to, autoRenew, complimentary, paddle} = subscription
    if (complimentary)
        return <span>Free until <UtcTimestamp date={to} dateOnly/>, then {freePlan.name}</span>
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

/**
 * Free plan card, shown while an account has no subscription
 * @param {String} changeLink
 * @param {String} changeTitle
 * @return {JSX.Element}
 * @private
 */
function FreePlanView({changeLink, changeTitle}) {
    return <div className="card card-blank billing-card text-center billing-subscription-card">
        <div className="space">
            <div>
                <strong>{freePlan.name}</strong>
                <span className="dimmed">&nbsp;· {describePlanShort(freePlan)}</span>
            </div>
            <div className="dimmed text-small micro-space">{freePlan.audience}</div>
            <div className="micro-space">
                <a href={changeLink} className="button">{changeTitle}</a>
            </div>
        </div>
    </div>
}
