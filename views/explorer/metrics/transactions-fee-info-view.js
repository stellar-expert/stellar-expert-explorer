import React from 'react'
import {Amount, UpdateHighlighter} from '@stellar-expert/ui-framework'

export default function TransactionFeeInfoView({lastLedger, capacity}) {

    return <div>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Capacity Usage</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter>{(capacity * 100).toFixed(2)}%</UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Base Operation Fee</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={lastLedger.baseFee} asset="XLM" issuer={false} adjust/></UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Base Reserve</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={lastLedger.baseReserve} asset="XLM" issuer={false} adjust/></UpdateHighlighter>
                    </div>
                </div>
            </div>
        </div>
    </div>
}