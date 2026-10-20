import React from 'react'
import PolicyPageView from './policy-page-view'
import source from './refund-policy.md'

export default function RefundPageView() {
    return <PolicyPageView source={source}
                           description="Refund policy for StellarExpert digital products and API subscriptions."/>
}
