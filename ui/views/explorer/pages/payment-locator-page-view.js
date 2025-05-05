import React from 'react'
import {usePageMetadata} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import TxHistoryView from '../tx/tx-history-view'

export default function PaymentLocatorPage() {
    usePageMetadata({
        title: `Payment locator`,
        description: `Explore payments on the Stellar ${config.activeNetwork} network. Search by amount, assets, transaction memo, source/destination account.`
    })
    return <div className="container narrow">
        <h2>Transaction Locator</h2>
        <div className="segment blank">
            Explore transactions on Stellar {config.activeNetwork} network.
            <ul className="list checked">
                <li>Lookup by transaction memo, asset, source/destination account.</li>
                <li>Search by a single parameter or a complex criteria.</li>
                <li>All operations are supported: PAYMENT, PATH_PAYMENT, CREATE_ACCOUNT, MERGE_ACCOUNT.</li>
                <li>Find everything, no matter how long ago transactions were processed.</li>
                <li>Works even with deleted(merged) accounts.</li>
            </ul>
        </div>
        <div className="space">
            <TxHistoryView presetFilter={{}}/>
        </div>
    </div>
}