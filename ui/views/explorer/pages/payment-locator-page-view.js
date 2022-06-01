import React from 'react'
import PaymentLocator from '../payment-locator/payment-locator-view'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import config from '../../../app-settings'

function PaymentLocatorPage() {
    setPageMetadata({
        title: `Payment locator`,
        description: `Explore payments on the Stellar ${config.activeNetwork} network. Search by amount, assets, transaction memo, source/destination account.`
    })
    return <div className="container narrow">
        <div className="card">
            <h3>Payment Locator</h3>
            <hr/>
            <div className="space"></div>
            Explore payments on the Stellar {config.activeNetwork} network.
            <ul className="list checked">
                <li>Lookup by transaction memo, amount, asset, source/destination account.</li>
                <li>Search by a single parameter or a complex criteria.</li>
                <li>All operations are supported: PAYMENT, PATH_PAYMENT, CREATE_ACCOUNT, MERGE_ACCOUNT.</li>
                <li>Find everything, no matter how long ago operations were submitted.</li>
                <li>Works even with deleted(merged) accounts.</li>
                <li><a target="_blank" rel="noreferrer noopener" href="/openapi.html#tag/Payment-Locator-API">
                    Free API for developers.</a></li>
            </ul>
            <div className="double-space">
                <PaymentLocator/>
            </div>
        </div>
    </div>
}

export default PaymentLocatorPage