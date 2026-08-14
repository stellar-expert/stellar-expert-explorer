import React, {useCallback, useEffect, useState} from 'react'
import cn from 'classnames'
import {Button, UtcTimestamp, navigation, useParams} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {allPlans, findPlan} from '../../../../business-logic/billing/api-plans'
import {addMonths, describeDays, getDaysLeft} from '../../utils/date-resolver'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'

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
    {name: 'photons', title: 'Photons/month'},
    {name: 'requestsPerMinute', title: 'Requests/minute'},
    {name: 'batchSize', title: 'Items/batch response'},
    {name: 'priceOverride', title: 'Price override, USD/month'}
]

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

    useEffect(() => {
        if (!id)
            return
        setIsLoading(true)
        apiRequest(`account/${id}`)
            .then(res => {
                setAccount(res)
                setForm(initForm(res.subscription))
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

    const save = useCallback(() => {
        setIsSaving(true)
        apiRequest(`account/${id}/subscription`, {method: 'POST', params: buildParams(form)})
            .then(() => {
                notify({type: 'success', message: 'Subscription has been updated'})
                navigation.navigate(back)
            })
            .catch(error => notify({type: 'error', message: 'Failed to update subscription. ' + error?.message}))
            .finally(() => setIsSaving(false))
    }, [id, form, back])

    const title = <>Edit subscription&nbsp;&nbsp;<span className="billing-badge admin text-tiny">ADMIN</span></>
    const action = <span className="dimmed text-small">
        <code className="text-small billing-account-ref">account #{shortenString(id, 8)}</code>
        {!!account?.email && <>&nbsp;·&nbsp;{account.email}</>}
    </span>

    if (isLoading || !form)
        return <SimplePageLayout title={title} action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    const plan = findPlan(form.plan)
    const {subscription} = account
    const isTermSet = !!subscription || !!form.extendMonths

    return <SimplePageLayout title={title} action={action}>
        <div className="row">
            <div className="column column-50">
                <div className="card card-blank billing-card billing-plan-picker">
                    <div className="dimmed text-small">PLAN</div>
                    {allPlans.map(entry => <PlanOptionView key={entry.key} plan={entry}
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
                    <TermView subscription={subscription} extendMonths={form.extendMonths}/>
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
                    <label className="micro-space">
                        <input type="checkbox" checked={form.notifyOwner} onChange={toggleNotify}/>
                        &nbsp;Notify account owner by email
                    </label>
                    <div className="row space">
                        <div className="column column-33">
                            <Button block disabled={isSaving || !isTermSet} onClick={save}>Confirm</Button>
                        </div>
                        <div className="column column-33">
                            <Button block outline href={back}>Cancel</Button>
                        </div>
                    </div>
                    {!isTermSet && <div className="dimmed text-tiny micro-space">
                        This account has no subscription yet - choose a term to start one.
                    </div>}
                </div>
            </div>
        </div>
    </SimplePageLayout>
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
    const {photons, requestsPerMinute} = plan.limits

    return <div className={cn('billing-plan-option-row', {selected})}>
        <div>
            <strong>{plan.name}</strong>
            <div className="dimmed text-tiny">{describePlanOffer(plan, photons, requestsPerMinute)}</div>
        </div>
        {selected ?
            <i className="icon-ok color-highlight" title="Selected"/> :
            <a href="#" data-plan={plan.key} onClick={onSelect} className="text-small">Select</a>}
    </div>
}

/**
 * The term as it stands, and what the chosen extension would make of it
 * @param {{from: Number, to: Number}} [subscription]
 * @param {Number} [extendMonths]
 * @return {JSX.Element}
 * @private
 */
function TermView({subscription, extendMonths}) {
    if (!subscription)
        return <div className="micro-space">
            <span className="dimmed">Not subscribed</span>
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
 * @return {{}}
 * @private
 */
function initForm(subscription) {
    const limits = subscription?.limits || {}
    return {
        plan: subscription?.plan || allPlans[0].key,
        photons: valueOf(limits.photons),
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
        params.photons = form.photons
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
 * @param {Number|null} photons
 * @param {Number|null} requestsPerMinute
 * @return {String}
 * @private
 */
function describePlanOffer(plan, photons, requestsPerMinute) {
    if (plan.custom)
        return 'Custom limits'
    const allowance = photons ? `${formatWithAutoPrecision(photons)} photons/month` : 'Free'
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