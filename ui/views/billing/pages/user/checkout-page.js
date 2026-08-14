import React, {useCallback, useEffect, useState} from 'react'
import cn from 'classnames'
import {Button, UtcTimestamp, parseQuery} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {findPlan, resolvePlanPrice} from '../../../../business-logic/billing/api-plans'
import {useSession} from '../../auth/auth-session'
import {getSubscriptionPeriod} from '../../utils/date-resolver'
import SimplePageLayout from '../../layout/simple-page-layout'

const averageMonth = 365.25 / 12 * 24 * 60 * 60 * 1000

const paymentMethods = [
    {
        key: 'card',
        title: 'Credit card',
        description: 'Visa, Mastercard, Amex · charged automatically each period'
    },
    {
        key: 'crypto',
        title: 'Crypto',
        description: 'USDC, XLM and 40+ assets through our payment processor'
    },
    {
        key: 'invoice',
        title: 'Invoice',
        description: 'Bank transfer, Cosmographer plans only',
        requiresCustomPlan: true
    }
]

/**
 * Order confirmation for a plan change
 * @return {JSX.Element}
 */
export default function CheckoutPage() {
    const {userId, email} = useSession()
    const {plan: planKey, period = 'month'} = parseQuery()
    const plan = findPlan(planKey)
    const [method, setMethod] = useState('card')
    const [subscription, setSubscription] = useState()

    useEffect(() => {
        if (!userId)
            return
        apiRequest(`account/${userId}`)
            .then(account => setSubscription(account?.subscription || null))
            .catch(() => setSubscription(null))
    }, [userId])

    const changeMethod = useCallback(e => setMethod(e.target.value), [])

    if (!plan)
        return <SimplePageLayout title="Confirm and pay">
            <div className="dimmed text-center space">
                Nothing selected to pay for. <a href="/account/subscription/change">Pick a plan</a> first.
            </div>
        </SimplePageLayout>

    if (plan.custom)
        return <SimplePageLayout title="Confirm and pay">
            <div className="dimmed text-center space">
                {plan.name} is quoted per contract.{' '}
                <a href={`mailto:info@stellar.expert?subject=${encodeURIComponent(plan.name + ' plan enquiry')}`}>
                    Contact us
                </a> to agree the terms.
            </div>
        </SimplePageLayout>

    const action = <a href="/account/subscription/change">← Back to plans</a>

    return <SimplePageLayout title="Confirm and pay" action={action}>
        <div className="row">
            <div className="column column-66">
                <div className="card card-blank billing-card billing-checkout-methods">
                    <div className="dimmed text-small">PAYMENT METHOD</div>
                    {paymentMethods.map(entry => <PaymentOptionView key={entry.key} option={entry} selected={method}
                                                                    disabled={entry.requiresCustomPlan && !plan.custom}
                                                                    onChange={changeMethod}/>)}
                    {method === 'card' && <CardFieldsetView email={email}/>}
                </div>
            </div>
            <div className="column column-33">
                <OrderSummaryView plan={plan} period={period} subscription={subscription}/>
            </div>
        </div>
    </SimplePageLayout>
}

/**
 * @param {{key: String, title: String, description: String}} option
 * @param {String} selected
 * @param {Boolean} [disabled]
 * @param {Function} onChange
 * @return {JSX.Element}
 * @private
 */
function PaymentOptionView({option, selected, disabled, onChange}) {
    const {key, title, description} = option
    return <label className={cn('billing-payment-option', {selected: selected === key, disabled})}>
        <input type="radio" name="payment-method" value={key} checked={selected === key} disabled={disabled}
               onChange={onChange}/>
        <span>
            <strong>{title}</strong>
            <span className="dimmed text-small">{description}</span>
        </span>
    </label>
}

/**
 * Layout placeholder for the processor's hosted card fields
 * @param {String} [email]
 * @return {JSX.Element}
 * @private
 */
function CardFieldsetView({email}) {
    return <div className="billing-card-fields space">
        <div>
            <label className="dimmed text-small">Card number</label>
            <div className="billing-field-placeholder">•••• •••• •••• ••••</div>
        </div>
        <div className="row">
            <div className="column column-50">
                <label className="dimmed text-small">Expiry</label>
                <div className="billing-field-placeholder">MM/YY</div>
            </div>
            <div className="column column-50">
                <label className="dimmed text-small">CVC</label>
                <div className="billing-field-placeholder">•••</div>
            </div>
        </div>
        <div>
            <label className="dimmed text-small">Billing email</label>
            <div className="billing-field-placeholder">{email || '—'}</div>
        </div>
        <div className="dimmed text-tiny micro-space">
            Card details are entered in the payment processor&apos;s own secure fields, which replace this
            block once the integration lands.
        </div>
    </div>
}

/**
 * Whatever is left of the term the account already paid for
 * @param {{plan: String, price: Number, from: Number, to: Number}} [subscription]
 * @return {Number} - USD, 0 when there is nothing to credit
 */
function resolveUnusedCredit(subscription) {
    if (!subscription)
        return 0
    const {price, from, to} = subscription
    const now = Date.now()
    if (!price || !(to > now) || !(to > from))
        return 0
    const termMonths = Math.max(1, Math.round((to - from) / averageMonth))
    return Math.round(price * termMonths * (to - now) / (to - from) * 100) / 100
}

/**
 * What the change costs today and what it renews at
 * @param {ApiPlan} plan
 * @param {'month'|'year'} period
 * @param {{}} [subscription] - the plan in force, undefined until the account loads
 * @return {JSX.Element}
 * @private
 */
function OrderSummaryView({plan, period, subscription}) {
    const total = resolvePlanPrice(plan, period).term
    const allowance = plan.limits.photons
    const credit = Math.min(resolveUnusedCredit(subscription), total)
    const due = total - credit
    const [, renewsOn] = getSubscriptionPeriod(period)
    const currentPlan = subscription && (findPlan(subscription.plan)?.name || subscription.plan)

    return <div className="card card-blank billing-card billing-order-summary">
        <div className="dimmed text-small">ORDER SUMMARY</div>
        <div className="micro-space">
            <div className="dual-layout">
                <strong>{plan.name}</strong>
                <span className="billing-order-amount">${total.toFixed(2)}</span>
            </div>
            <div className="dimmed text-tiny">
                {period === 'year' ? 'Yearly' : 'Monthly'} billing
                {!!allowance && <> · {formatWithAutoPrecision(allowance)} photons/month</>}
            </div>
        </div>
        <hr className="micro-space"/>
        {credit > 0 && <div className="dual-layout text-small nano-space">
            <span>Unused {currentPlan} time</span>
            <span className="color-success nowrap">−${credit.toFixed(2)}</span>
        </div>}
        <div className="dual-layout text-small nano-space">
            <span>VAT (0%)</span>
            <span className="nowrap">$0.00</span>
        </div>
        <hr className="micro-space"/>
        <div className="dual-layout">
            <span>Due today</span>
            <span className="billing-order-total">${due.toFixed(2)}</span>
        </div>
        <div className="dimmed text-tiny">
            Then ${total.toFixed(2)} on <UtcTimestamp date={renewsOn} dateOnly/>. Cancel any time.
        </div>
        <Button block disabled className="space" title="Payment is wired up once the processor is integrated">
            Pay ${due.toFixed(2)}
        </Button>
        <div className="dimmed text-tiny text-center micro-space">
            New limits apply immediately after payment.
        </div>
    </div>
}