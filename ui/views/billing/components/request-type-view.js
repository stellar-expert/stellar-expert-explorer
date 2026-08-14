import React from 'react'
import {requestTypeTitles, rejectionReasonTitles} from '../../../business-logic/billing/request-types'

/**
 * Request type of a log entry, followed by the reason when the gateway turned the request away
 * @param {{requestType: String, data: {reason: String}}} entry
 */
export default function RequestTypeView({entry: {requestType, data}}) {
    return <>
        <span className="request-type">{requestTypeTitles[requestType] || requestType}</span>
        {!!data?.reason && <span className="dimmed text-small">
            &nbsp;{rejectionReasonTitles[data.reason] || data.reason}
        </span>}
    </>
}