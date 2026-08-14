import React from 'react'
import TokenListView from './token-list-view'

/**
 * The card or wallet currently on file
 * @param {{brand: String, last4: String, expiry: String}} [method]
 * @return {JSX.Element}
 */
export default function PaymentMethodView({method}) {
    return <div className="card card-blank billing-card billing-payment-method">
        <div className="dimmed text-small">PAYMENT METHOD</div>
        {method ? <div className="dual-layout micro-space">
            <span className="billing-card-number">
                <span className="billing-card-brand">{method.brand}</span>
                <code>•••• •••• •••• {method.last4}</code>
                <span className="dimmed text-small">exp {method.expiry}</span>
            </span>
            <a href="/account/subscription/checkout">Change</a>
        </div> : <TokenListView tokens={[]} placeholder="(No payment method)"/>}
        <div className="dimmed text-tiny space">
            Card, or crypto through our payment processor. Enterprise accounts can be invoiced.
        </div>
    </div>
}