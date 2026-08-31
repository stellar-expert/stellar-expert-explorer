import React from 'react'
import {requestTypeTitles, rejectionReasonTitles} from '../../../business-logic/billing/request-types'

/**
 * Request type of a log entry
 * @param {{requestType: String, data: {reason: String, amount: Number, method: String}}} entry
 */
export default function RequestTypeView({entry: {requestType, data}}) {
    return <>
        <span className="request-type">{requestTypeTitles[requestType] || requestType}</span>
        {!!data?.reason && <span className="dimmed text-small">
            &nbsp;{rejectionReasonTitles[data.reason] || data.reason}
        </span>}
        {requestType === 'payment' && <span className="dimmed text-small">
            &nbsp;${data.amount.toFixed(2)}&nbsp;·&nbsp;{data.method}
        </span>}
    </>
}