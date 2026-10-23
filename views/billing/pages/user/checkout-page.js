import React, {useCallback, useEffect, useState} from 'react'
import {Button, UtcTimestamp, navigation, parseQuery} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiRequest, performApiCall} from '../../../../business-logic/billing/billing-api'
import {findPlan, formatAmount, resolvePlanPrice} from '../../../../business-logic/billing/api-plans'
import {isManagedByStaff} from '../../../../business-logic/billing/account-status'
import {initializePaddle, resolveCheckoutTheme, subscribePaddleEvents}
    from '../../../../business-logic/billing/paddle-loader'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import PaymentMethodView from '../../components/payment-method-view'
import NoticeView from '../../components/notice-view'

const title = 'Confirm and pay'
//Paddle.js renders the inline checkout into the element carrying this class
const frameTarget = 'billing-checkout-frame'
//a completed checkout reaches the account through the server - how long to wait for it
const pollInterval = 2000
const pollAttempts = 30
//the server pulls from Paddle at most once in 5 seconds per account
const syncEvery = 3

/**
 * Order confirmation - the hosted checkout for a first subscription, a priced plan change for a running one
 * @return {JSX.Element}
 */
export default function CheckoutPage() {
    const {userId, impersonated} = useSession()
    const query = parseQuery()
    const plan = findPlan(query.plan)
    const period = query.period === 'year' ? 'year' : 'month'
    const [account, setAccount] = useState()
    const [loadError, setLoadError] = useState()

    useEffect(() => {
        if (!userId)
            return
        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => setLoadError('Failed to retrieve account data. ' + error.message))
    }, [userId])

    const action = <a href="/account/subscription/change">← Back to plans</a>

    if (!plan?.price && !plan?.custom)
        return <SimplePageLayout title={title}>
            <NoticeView>
                Nothing selected to pay for. <a href="/account/subscription/change">Pick a plan</a> first.
            </NoticeView>
        </SimplePageLayout>

    if (plan.custom)
        return <SimplePageLayout title={title} action={action}>
            <NoticeView>
                {plan.name} is quoted per contract. <ContactLinkView subject={plan.name + ' plan enquiry'}/> to
                agree the terms.
            </NoticeView>
        </SimplePageLayout>

    if (loadError)
        return <SimplePageLayout title={title} action={action}>
            <NoticeView warning>{loadError}</NoticeView>
        </SimplePageLayout>

    if (!account)
        return <SimplePageLayout title={title} action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    const {subscription} = account
    //each order starts over - an error or a transaction from another selection does not carry into it
    const order = `${plan.key}-${period}`
    let content
    if (impersonated) {
        content = <NoticeView>
            Payments are made by the account owner - plans cannot be bought or changed while logged in as a
            customer.
        </NoticeView>
    } else if (subscription?.provider === 'paddle') {
        content = <PlanChangeView key={order} account={account} plan={plan} period={period}/>
    } else if (isManagedByStaff(account)) {
        content = <NoticeView>
            Your plan was arranged with our team, so changes to it go through us as well.{' '}
            <ContactLinkView subject="Subscription change"/> to switch to {plan.name}.
        </NoticeView>
    } else {
        content = <NewSubscriptionView key={order} userId={userId} plan={plan} period={period}/>
    }

    return <SimplePageLayout title={title} action={action}>
        {content}
    </SimplePageLayout>
}

/**
 * First subscription - Paddle's inline checkout, with the order summary built from what it reports
 * @param {String} userId
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @return {JSX.Element}
 * @private
 */
function NewSubscriptionView({userId, plan, period}) {
    const [totals, setTotals] = useState()
    const [stage, setStage] = useState('loading')
    const [error, setError] = useState()

    useEffect(() => {
        let paddle
        let transactionId
        let unmounted = false

        //the account changes once the server has applied the payment, not when the checkout reports it. Paddle
        //may create the subscription a moment after the payment, so the pull is repeated - no more often than
        //the server accepts it, and without relying on webhooks reaching it
        async function activate() {
            for (let attempt = 0; attempt < pollAttempts && !unmounted; attempt++) {
                if (attempt % syncEvery === 0) {
                    await performApiCall(`account/${userId}/paddle/sync`, {method: 'POST'})
                }
                const account = await performApiCall(`account/${userId}`)
                if (unmounted)
                    return
                if (account?.subscription?.provider === 'paddle') {
                    notify({type: 'success', message: `Your ${plan.name} subscription is active`})
                    return navigation.navigate('/account/subscription')
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval))
            }
            if (!unmounted) {
                setStage('delayed')
            }
        }

        const unsubscribe = subscribePaddleEvents(({name, data, detail}) => {
            if (unmounted || !transactionId)
                return
            if (name === 'checkout.error')
                return setError(detail || 'The payment form reported an error.')
            if (data?.transaction_id !== transactionId)
                return
            if (data.totals) {
                setTotals(summarizeTotals(data))
            }
            if (name === 'checkout.loaded') {
                setStage('ready')
            } else if (name === 'checkout.completed') {
                setStage('activating')
                activate()
            }
        })

        //no transaction is created unless the form that pays for it can be shown
        initializePaddle()
            .then(instance => {
                paddle = instance
                return apiRequest(`account/${userId}/checkout`, {method: 'POST', params: {plan: plan.key, period}})
            })
            .then(res => {
                if (unmounted)
                    return
                transactionId = res.transactionId
                paddle.Checkout.open({
                    transactionId,
                    settings: {
                        displayMode: 'inline',
                        frameTarget,
                        frameInitialHeight: 450,
                        frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
                        variant: 'one-page',
                        theme: resolveCheckoutTheme(),
                        allowLogout: false
                    }
                })
            })
            .catch(e => {
                if (!unmounted) {
                    setError(e.message)
                }
            })

        return () => {
            unmounted = true
            unsubscribe()
            if (transactionId) {
                paddle.Checkout.close()
            }
        }
    }, [userId, plan, period])

    return <div className="row">
        <div className="column column-66">
            <div className="card card-blank billing-card billing-checkout">
                {!!error && <NoticeView warning>
                    {error} <a href="/account/subscription">Back to subscription</a>
                </NoticeView>}
                {stage === 'loading' && !error && <SegmentLoader inside/>}
                {stage === 'activating' && <NoticeView>
                    Payment received. Activating your subscription&hellip;
                </NoticeView>}
                {stage === 'delayed' && <NoticeView>
                    Payment received. Your subscription is still being set up and will show up on
                    the <a href="/account/subscription">subscription page</a> within a few minutes.
                </NoticeView>}
                <div className={frameTarget}/>
            </div>
        </div>
        <div className="column column-33">
            <OrderSummaryView plan={plan} period={period}>
                <TotalView amount={totals ? totals.total : resolvePlanPrice(plan, period).term}
                           tax={totals?.tax} currency={totals?.currency}/>
                <div className="dimmed text-tiny">
                    Then {formatAmount(totals?.recurring ?? resolvePlanPrice(plan, period).term, totals?.currency)}
                    /{period === 'year' ? 'year' : 'month'}. Cancel any time.
                </div>
                <div className="dimmed text-tiny micro-space">
                    New limits apply immediately after payment.
                </div>
            </OrderSummaryView>
        </div>
    </div>
}

/**
 * Switching a running Paddle subscription - priced by the server, charged to the payment method on file
 * @param {{id: String, subscription: {}, paymentMethod: {}}} account
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @return {JSX.Element}
 * @private
 */
function PlanChangeView({account, plan, period}) {
    const {id, subscription, paymentMethod} = account
    const isCurrent = subscription.plan === plan.key && subscription.period === period
    const [preview, setPreview] = useState()
    const [error, setError] = useState()
    const [isProgress, setIsProgress] = useState(false)

    useEffect(() => {
        if (isCurrent)
            return
        apiRequest(`account/${id}/subscription/change/preview`, {method: 'POST', params: {plan: plan.key, period}})
            .then(setPreview)
            .catch(e => setError(e.message))
    }, [id, plan, period, isCurrent])

    const confirm = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${id}/subscription/change`, {method: 'POST', params: {plan: plan.key, period}})
            .then(() => {
                notify({type: 'success', message: `Your plan has been changed to ${plan.name}`})
                navigation.navigate('/account/subscription')
            })
            .catch(e => {
                setError(e.message)
                setIsProgress(false)
            })
    }, [id, plan, period])

    if (isCurrent)
        return <NoticeView>
            You are already on {plan.name}, billed {period === 'year' ? 'yearly' : 'monthly'}.{' '}
            <a href="/account/subscription/change">Pick another plan</a>.
        </NoticeView>

    const currentPlan = findPlan(subscription.plan)?.name || subscription.plan
    //what the balance gains now - the difference of the two allowances, prorated, and negative on a downgrade
    const units = preview?.unitsAdded || 0
    const currency = preview?.currency

    return <div className="row">
        <div className="column column-66">
            <div className="card card-blank billing-card billing-checkout">
                <div className="dimmed text-small">PLAN CHANGE</div>
                <div className="micro-space">
                    {currentPlan}, {subscription.period === 'year' ? 'yearly' : 'monthly'} →{' '}
                    <strong>{plan.name}, {period === 'year' ? 'yearly' : 'monthly'}</strong>
                </div>
                <ul className="dimmed text-small micro-space">
                    <li>The new limits apply as soon as the payment goes through.</li>
                    {preview?.credit > 0 && <li>
                        Unused {currentPlan} time is credited against the price.
                    </li>}
                    {units > 0 && <li>
                        {formatWithAutoPrecision(units)} compute units are added to your balance now, in proportion
                        to what is left of the current period.
                    </li>}
                    {units < 0 && <li>
                        Your balance is reduced by {formatWithAutoPrecision(-units)} compute units, in proportion
                        to what is left of the current period.
                    </li>}
                </ul>
            </div>
            <div className="space">
                <PaymentMethodView method={paymentMethod}/>
            </div>
        </div>
        <div className="column column-33">
            <OrderSummaryView plan={plan} period={period}>
                {error ?
                    <NoticeView warning>{error}</NoticeView> :
                    preview ? <>
                        {preview.credit > 0 && <div className="dual-layout text-small micro-space">
                            <span>Unused {currentPlan} time</span>
                            <span className="color-success nowrap">{formatAmount(-preview.credit, currency)}</span>
                        </div>}
                        <TotalView amount={preview.dueToday} tax={preview.tax} currency={currency}/>
                        {!!preview.nextBilledAt && <div className="dimmed text-tiny">
                            Then {formatAmount(preview.nextAmount, currency)} on{' '}
                            <UtcTimestamp date={preview.nextBilledAt} dateOnly/>.
                        </div>}
                    </> :
                    <SegmentLoader inside/>}
                <Button block className="space" disabled={!preview || !!error || isProgress} onClick={confirm}>
                    {preview?.dueToday > 0 ? `Pay ${formatAmount(preview.dueToday, currency)}` : 'Confirm change'}
                </Button>
                <div className="dimmed text-tiny text-center micro-space">
                    Charged to your payment method on file.
                </div>
            </OrderSummaryView>
        </div>
    </div>
}

/**
 * The plan being bought, above whatever the order costs
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @param {*} children
 * @return {JSX.Element}
 * @private
 */
function OrderSummaryView({plan, period, children}) {
    const allowance = plan.limits.computeUnits
    return <div className="card card-blank billing-card billing-order-summary">
        <div className="dimmed text-small">ORDER SUMMARY</div>
        <div className="micro-space">
            <div className="dual-layout">
                <strong>{plan.name}</strong>
                <span className="billing-order-amount">{formatAmount(resolvePlanPrice(plan, period).term)}</span>
            </div>
            <div className="dimmed text-tiny">
                {period === 'year' ? 'Yearly' : 'Monthly'} billing
                {!!allowance && <> · {formatWithAutoPrecision(allowance)} compute units/month</>}
            </div>
        </div>
        <hr className="micro-space"/>
        {children}
    </div>
}

/**
 * What falls due today. Prices include tax, so the tax is a share of the total rather than an addition to it
 * @param {Number} amount
 * @param {Number} [tax]
 * @param {String} [currency]
 * @return {JSX.Element}
 * @private
 */
function TotalView({amount, tax, currency}) {
    return <>
        <div className="dual-layout">
            <span>Due today</span>
            <span className="billing-order-total">{formatAmount(amount, currency)}</span>
        </div>
        <div className="dimmed text-tiny">
            {tax > 0 ? `Includes ${formatAmount(tax, currency)} tax.` : 'Taxes included.'}
        </div>
    </>
}

/**
 * @param {String} subject
 * @return {JSX.Element}
 * @private
 */
function ContactLinkView({subject}) {
    return <a href={`mailto:info@stellar.expert?subject=${encodeURIComponent(subject)}`}>Contact us</a>
}

/**
 * Figures of a Paddle checkout event
 * @param {{totals: {total: Number, tax: Number}, recurring_totals: {total: Number}, currency_code: String}} data
 * @return {{total: Number, tax: Number, recurring: Number, currency: String}}
 * @private
 */
function summarizeTotals({totals, recurring_totals: recurring, currency_code: currency}) {
    return {total: totals.total, tax: totals.tax, recurring: recurring?.total, currency}
}
