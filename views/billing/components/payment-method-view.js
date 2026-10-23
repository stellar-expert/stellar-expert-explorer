import React, {useCallback} from 'react'
import TokenListView from './token-list-view'

/**
 * Instrument names as a payment line shows them
 */
const methodTitles = {
    card: 'Card',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    alipay: 'Alipay',
    ideal: 'iDEAL',
    bancontact: 'Bancontact',
    korea_local: 'Korean local payment',
    wire_transfer: 'Wire transfer',
    invoice: 'Bank transfer'
}

/**
 * Card networks as reported by the payment processor
 */
const cardBrands = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    american_express: 'Amex',
    discover: 'Discover',
    diners_club: 'Diners Club',
    jcb: 'JCB',
    maestro: 'Maestro',
    union_pay: 'UnionPay',
    mada: 'mada'
}

/**
 * @typedef {Object} PaymentMethod
 * @property {String} type - "card", "paypal", "apple_pay", "google_pay", any other Paddle payment method type,
 * or "invoice" for a contract paid by bank transfer
 * @property {String} [brand] - card network, also present on a wallet backed by a card
 * @property {String} [last4]
 * @property {String} [expiry] - as `MM/YY`
 */

/**
 * How the account pays - the instrument every invoice of its billing history was charged to
 * @param {PaymentMethod} [method]
 * @param {Function} [onChange] - omitted where the instrument cannot be replaced from the dashboard
 * @param {Boolean} [disabled]
 * @return {JSX.Element}
 */
export default function PaymentMethodView({method, onChange, disabled}) {
    const change = useCallback(e => {
        e.preventDefault()
        if (!disabled) {
            onChange()
        }
    }, [onChange, disabled])

    const changeLink = !!onChange && <a href="#" className={disabled ? 'disabled' : undefined} onClick={change}>
        {method ? 'Change' : 'Add'}
    </a>

    return <div className="card card-blank billing-card billing-payment-method">
        <div className="dimmed text-small">PAYMENT METHOD</div>
        {method ? <div className="dual-layout micro-space">
            <MethodDetailsView method={method}/>
            {changeLink}
        </div> : <div className="dual-layout">
            <TokenListView tokens={[]} placeholder="(No payment method)"/>
            {changeLink}
        </div>}
        <div className="dimmed text-tiny space">
            Card, PayPal, Apple Pay or Google Pay. Cosmographer plans can be invoiced.
        </div>
    </div>
}

/**
 * @param {PaymentMethod} method
 * @return {JSX.Element}
 * @private
 */
function MethodDetailsView({method}) {
    const {brand, last4, expiry} = method
    //the processor spells wallets both ways - "apple_pay" in its API, "apple-pay" in its checkout events
    const type = method.type?.replace(/-/g, '_')
    if (type === 'invoice')
        return <span className="billing-card-number">
            <span className="billing-card-brand">{methodTitles.invoice}</span>
            <span className="dimmed text-small">invoiced against the contract</span>
        </span>

    const isCard = type === 'card'
    const title = isCard ? describeCardBrand(brand) : methodTitles[type] || describeCardBrand(type)
    return <span className="billing-card-number">
        <span className="billing-card-brand">{title}</span>
        {!isCard && !!brand && <span className="dimmed text-small">{describeCardBrand(brand)}</span>}
        {!!last4 && <code>••{last4}</code>}
        {!!expiry && <span className="dimmed text-small">exp {expiry}</span>}
    </span>
}

/**
 * @param {String} [brand]
 * @return {String}
 * @private
 */
function describeCardBrand(brand) {
    if (!brand)
        return methodTitles.card
    return cardBrands[brand.toLowerCase()] || brand.replace(/[_-]+/g, ' ').replace(/^\w/, c => c.toUpperCase())
}
