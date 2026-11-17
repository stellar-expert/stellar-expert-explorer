import React, {useCallback, useEffect, useState} from 'react'
import cn from 'classnames'
import {Button, UtcTimestamp, navigation, parseQuery, useParams} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {allPlans, findPlan} from '../../../../business-logic/billing/api-plans'
import {addMonths, describeDays, getDaysLeft} from '../../utils/date-resolver'
import {confirmAction} from '../../utils/confirm-action'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import NoticeView from '../../components/notice-view'
import SubscriptionSummaryView, {ProviderBadgeView} from '../../components/subscription-summary-view'

/**
 * Term extensions the server accepts - `extendOptions` in its `src/subscription.js`
 */
const extendOptions = [
    {months: 1, title: '+1 month'},
    {months: 6, title: '+6 months'},
    {months: 12, title: '+1 year'}
]

/**
 * The negotiated figures of a custom contract, named as the server's `SubscriptionInput` names them
 */
const limitFields = [
    {name: 'computeUnits', title: 'Compute units/month'},
    {name: 'requestsPerMinute', title: 'Requests/minute'},
    {name: 'batchSize', title: 'Items/batch response'},
    {name: 'priceOverride', title: 'Price override, USD/month'}
]

/**
 * The plan a customer paying through Paddle can be moved to by staff - its limits and price are negotiated
 */
const customPlan = allPlans.find(plan => plan.custom)

/**
 * Assigning and amending an account's plan
 *
 * A page rather than the dialog this replaced: a contract carries negotiated limits, a price override, a
 * term and a staff note, and none of that fits a modal without becoming a scrolling form.
 * @return {JSX.Element}
 */
export default function UserSubscriptionPage() {
    const {id} = useParams()
    const [account, setAccount] = useState()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState()
    //staff are setting up a custom contract to replace the plan the customer pays through Paddle
    const [replacingPaddle, setReplacingPaddle] = useState(false)

    useEffect(() => {
        if (!id)
            return
        setIsLoading(true)
        apiRequest(`account/${id}`)
            .then(res => {
                setAccount(res)
                //the new account dialog sends staff here with the plan already picked
                setForm(initForm(res.subscription, parseQuery().plan))
            })
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [id])

    const back = `/admin/user/${id}`

    const selectPlan = useCallback(e => {
        const {plan} = e.currentTarget.dataset
        setForm(prev => ({...prev, plan}))
    }, [])

    const changeField = useCallback(e => {
        const {name, value} = e.target
        setForm(prev => ({...prev, [name]: value.replace(/\D/g, '')}))
    }, [])

    const changeNote = useCallback(e => setForm(prev => ({...prev, internalNote: e.target.value})), [])

    const toggleNotify = useCallback(e => {
        const {checked} = e.target
        setForm(prev => ({...prev, notifyOwner: checked}))
    }, [])

    const extend = useCallback(e => {
        const months = Number(e.currentTarget.dataset.months)
        setForm(prev => ({...prev, extendMonths: prev.extendMonths === months ? undefined : months}))
    }, [])

    //a new contract replaces the Paddle one, so it starts from a blank form with a term to choose
    const startReplacingPaddle = useCallback(() => {
        setForm(initForm(null, customPlan.key))
        setReplacingPaddle(true)
    }, [])

    const stopReplacingPaddle = useCallback(() => setReplacingPaddle(false), [])

    const save = useCallback(async () => {
        if (replacingPaddle && !await confirmAction(`End the Paddle subscription and move the account to the ` +
            `${customPlan.name} plan? Paddle stops billing now and nothing is refunded. Credits left on the ` +
            'current plan are burned, and the account is invoiced from now on.', `Switch to ${customPlan.name}`))
            return
        setIsSaving(true)
        const params = buildParams(form)
        if (replacingPaddle) {
            params.replacePaddle = true
        }
        apiRequest(`account/${id}/subscription`, {method: 'POST', params})
            .then(() => {
                notify({type: 'success', message: 'Subscription has been updated'})
                navigation.navigate(back)
            })
            .catch(error => notify({type: 'error', message: 'Failed to update subscription. ' + error?.message}))
            .finally(() => setIsSaving(false))
    }, [id, form, back, replacingPaddle])

    const title = replacingPaddle ? `Switch to ${customPlan.name}` : 'Edit subscription'
    const action = <span className="dimmed text-small">
        <code className="text-small billing-account-ref">account #{shortenString(id, 8)}</code>
        {!!account?.email && <>&nbsp;·&nbsp;{account.email}</>}
    </span>

    if (isLoading || !form)
        return <SimplePageLayout title={title} action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    const plan = findPlan(form.plan)
    if (account.subscription?.provider === 'paddle' && !replacingPaddle)
        return <SimplePageLayout title="Subscription" action={action}>
            <PaddleSubscriptionView account={account} back={back} onSwitch={startReplacingPaddle}/>
        </SimplePageLayout>

    //the Paddle plan ends with the switch - the contract replacing it starts a term of its own
    const subscription = replacingPaddle ? null : account.subscription
    const isTermSet = !!subscription || !!form.extendMonths
    const plans = replacingPaddle ? [customPlan] : allPlans

    return <SimplePageLayout title={title} action={action}>
        {replacingPaddle && <NoticeView warning className="space">
            The customer pays for the {findPlan(account.subscription.plan)?.name} plan through Paddle. Confirming ends
            that subscription immediately with no refund, burns the credits left on it, and starts this contract,
            invoiced by staff.
        </NoticeView>}
        <div className="row">
            <div className="column column-50">
                <div className="card card-blank billing-card billing-plan-picker">
                    <div className="dimmed text-small">PLAN</div>
                    {plans.map(entry => <PlanOptionView key={entry.key} plan={entry}
                                                        selected={entry.key === form.plan}
                                                        onSelect={selectPlan}/>)}
                    {!!plan?.custom && <div className="row space">
                        {limitFields.map(({name, title: label}) => <div key={name} className="column column-50">
                            <label className="dimmed text-small">{label}</label>
                            <input name={name} value={form[name] ?? ''} onChange={changeField}/>
                        </div>)}
                    </div>}
                </div>
            </div>
            <div className="column column-50">
                <div className="card card-blank billing-card billing-subscription-terms">
                    <div className="dimmed text-small">TERM</div>
                    <TermView subscription={subscription} extendMonths={form.extendMonths}
                              startLabel={replacingPaddle ? 'New contract' : undefined}/>
                    <div className="micro-space">
                        <span className="dimmed">Extend</span>&emsp;
                        {extendOptions.map(({months, title: label}) => <React.Fragment key={months}>
                            <a href="#" data-months={months} onClick={extend}
                               className={cn({dimmed: form.extendMonths && form.extendMonths !== months})}>
                                {label}
                            </a>&emsp;
                        </React.Fragment>)}
                    </div>
                    <div className="space">
                        <label className="dimmed text-small">Internal note</label>
                        <textarea value={form.internalNote} onChange={changeNote} rows={4}/>
                    </div>
                    <label className="billing-checkbox micro-space">
                        <input type="checkbox" checked={form.notifyOwner} onChange={toggleNotify}/>
                        Notify account owner by email
                    </label>
                    <div className="row space">
                        <div className="column column-33">
                            <Button block disabled={isSaving || !isTermSet} onClick={save}>Confirm</Button>
                        </div>
                        <div className="column column-33">
                            {replacingPaddle ?
                                <Button block outline disabled={isSaving} onClick={stopReplacingPaddle}>Cancel</Button> :
                                <Button block outline href={back}>Cancel</Button>}
                        </div>
                    </div>
                    {!isTermSet && <div className="dimmed text-tiny micro-space">
                        {replacingPaddle ?
                            'Choose the term of the new contract.' :
                            'This account has no subscription yet - choose a term to start one.'}
                    </div>}
                </div>
            </div>
        </div>
    </SimplePageLayout>
}

/**
 * A subscription the customer bought through Paddle. Its plan and term follow the payments Paddle reports, so
 * staff can look at it and end it, but not edit it
 * @param {{id: String, subscription: {}}} account
 * @param {String} back - where to return once it is cancelled
 * @param {Function} onSwitch - start setting up the custom contract that replaces it
 * @return {JSX.Element}
 * @private
 */
function PaddleSubscriptionView({account, back, onSwitch}) {
    const {id, subscription} = account
    const {subscriptionId, nextBilledAt, scheduledChange} = subscription.paddle || {}
    const [environment, setEnvironment] = useState()
    const [isProgress, setIsProgress] = useState(false)

    useEffect(() => {
        apiRequest('plans', {auth: false})
            .then(res => setEnvironment(res.paddle?.environment))
            .catch(() => setEnvironment(undefined))
    }, [])

    const cancel = useCallback(async () => {
        if (!await confirmAction('Cancel the subscription immediately? Paddle stops billing now and the account ' +
            'drops to the free plan. Nothing is refunded automatically - issue a refund from the Paddle dashboard ' +
            'if one is due.'))
            return
        setIsProgress(true)
        apiRequest(`account/${id}/subscription`, {method: 'DELETE'})
            .then(() => {
                notify({type: 'success', message: 'Subscription has been cancelled'})
                navigation.navigate(back)
            })
            .catch(error => {
                notify({type: 'error', message: 'Failed to cancel the subscription. ' + error?.message})
                setIsProgress(false)
            })
    }, [id, back])

    const dashboardLink = subscriptionId && environment &&
        `https://${environment === 'sandbox' ? 'sandbox-' : ''}vendors.paddle.com/subscriptions-v2/${subscriptionId}`

    return <div className="row">
        <div className="column column-50">
            <SubscriptionSummaryView account={account}/>
        </div>
        <div className="column column-50">
            <div className="card card-blank billing-card billing-subscription-terms">
                <div className="dimmed text-small">PADDLE</div>
                <NoticeView className="micro-space text-small">
                    The customer bought this plan and manages it from their dashboard. Plan, limits and term follow
                    the payments Paddle reports, so they cannot be edited here.
                </NoticeView>
                <div className="text-small">
                    <div>Status: <ProviderBadgeView subscription={subscription}/></div>
                    {!!nextBilledAt && <div>Next payment: <UtcTimestamp date={nextBilledAt} dateOnly/></div>}
                    {!!scheduledChange?.effectiveAt && <div>
                        Scheduled {scheduledChange.action}: <UtcTimestamp date={scheduledChange.effectiveAt} dateOnly/>
                    </div>}
                    {!!subscriptionId && <div>
                        Subscription:{' '}
                        {dashboardLink ?
                            <a href={dashboardLink} target="_blank" rel="noreferrer noopener">{subscriptionId}</a> :
                            <code>{subscriptionId}</code>}
                    </div>}
                </div>
                <div className="space">
                    <Button block disabled={isProgress} onClick={onSwitch}>Switch to {customPlan.name}</Button>
                </div>
                <div className="row micro-space">
                    <div className="column column-50">
                        <Button block outline disabled={isProgress} onClick={cancel}>Cancel immediately</Button>
                    </div>
                    <div className="column column-50">
                        <Button block outline href={back}>Back</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

/**
 * One selectable plan, with what it grants underneath it
 * @param {ApiPlan} plan
 * @param {Boolean} selected
 * @param {Function} onSelect
 * @return {JSX.Element}
 * @private
 */
function PlanOptionView({plan, selected, onSelect}) {
    const {computeUnits, requestsPerMinute} = plan.limits

    return <div className={cn('billing-plan-option-row', {selected})}>
        <div>
            <strong>{plan.name}</strong>
            <div className="dimmed text-tiny">{describePlanOffer(plan, computeUnits, requestsPerMinute)}</div>
        </div>
        {selected ?
            <i className="icon-ok" title="Selected"/> :
            <a href="#" data-plan={plan.key} onClick={onSelect} className="text-small">Select</a>}
    </div>
}

/**
 * The term as it stands, and what the chosen extension would make of it
 * @param {{from: Number, to: Number}} [subscription]
 * @param {Number} [extendMonths]
 * @param {String} [startLabel] - what stands before the first term
 * @return {JSX.Element}
 * @private
 */
function TermView({subscription, extendMonths, startLabel = 'Not subscribed'}) {
    if (!subscription)
        return <div className="micro-space">
            <span className="dimmed">{startLabel}</span>
            {!!extendMonths && <> → <strong>{describeMonths(extendMonths)} from today</strong></>}
        </div>

    const {from, to} = subscription
    const extended = extendMonths ? addMonths(to, extendMonths) : undefined

    return <div className="micro-space">
        <UtcTimestamp date={from} dateOnly/> → <UtcTimestamp date={extended || to} dateOnly/>
        <span className="dimmed">&nbsp;({describeDays(getDaysLeft(extended || to))} left)</span>
        {!!extended && <div className="dimmed text-tiny">
            currently ends <UtcTimestamp date={to} dateOnly/>
        </div>}
    </div>
}

/**
 * Form state for a subscription, or for the absence of one
 * @param {{}} [subscription] - as stored, normalized by the server
 * @param {String} [preselected] - plan to start a new subscription on
 * @return {{}}
 * @private
 */
function initForm(subscription, preselected) {
    const limits = subscription?.limits || {}
    return {
        plan: subscription?.plan || findPlan(preselected)?.key || allPlans[0].key,
        computeUnits: valueOf(limits.computeUnits),
        requestsPerMinute: valueOf(limits.requestsPerMinute),
        batchSize: valueOf(limits.batchSize),
        priceOverride: subscription?.custom ? valueOf(subscription.price) : '',
        internalNote: subscription?.internalNote || '',
        notifyOwner: false,
        extendMonths: undefined
    }
}

/**
 * Build tariff params
 * @param {{}} form
 * @return {{}}
 * @private
 */
function buildParams(form) {
    const params = {
        plan: form.plan,
        internalNote: form.internalNote.trim(),
        notifyOwner: form.notifyOwner
    }
    if (findPlan(form.plan)?.custom) {
        params.computeUnits = form.computeUnits
        params.requestsPerMinute = form.requestsPerMinute
        params.batchSize = form.batchSize
        params.priceOverride = form.priceOverride
    }
    if (form.extendMonths) {
        params.extendMonths = form.extendMonths
    }
    return params
}

/**
 * @param {ApiPlan} plan
 * @param {Number|null} computeUnits
 * @param {Number|null} requestsPerMinute
 * @return {String}
 * @private
 */
function describePlanOffer(plan, computeUnits, requestsPerMinute) {
    if (plan.custom)
        return 'Custom limits'
    const allowance = computeUnits ? `${formatWithAutoPrecision(computeUnits)} compute units/month` : 'Free'
    return `${allowance} · ${formatWithAutoPrecision(requestsPerMinute)} req/min`
}

/**
 * @param {Number} months
 * @return {String}
 * @private
 */
function describeMonths(months) {
    if (months === 12)
        return '1 year'
    return `${months} ${months === 1 ? 'month' : 'months'}`
}

/**
 * @param {Number|null} [value]
 * @return {String}
 * @private
 */
function valueOf(value) {
    return typeof value === 'number' ? String(value) : ''
}