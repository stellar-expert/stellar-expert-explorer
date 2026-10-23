import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {requestTypeTitles, rejectionReasonTitles} from '../../../business-logic/billing/request-types'
import {formatAmount} from '../../../business-logic/billing/api-plans'

/**
 * Entries whose `credits` is what they added to the balance - signed, for an adjustment that can take some away
 */
const creditingTypes = ['deposit', 'allowance-reset', 'allowance-adjusted']

/**
 * Request type of a log entry, with the rejection reason, payment details or balance change it carries
 * @param {{requestType: String, data: {reason: String, amount: Number, method: String, credits: Number,
 *          burned: Number, action: String}}} entry
 */
export default function RequestTypeView({entry: {requestType, data}}) {
    const credits = describeBalanceChange(requestType, data)
    return <>
        <span className="request-type">{requestTypeTitles[requestType] || requestType}</span>
        {!!data?.reason && <span className="dimmed text-small">
            &nbsp;{rejectionReasonTitles[data.reason] || data.reason}
        </span>}
        {requestType === 'payment' && <span className="dimmed text-small">
            &nbsp;${data.amount.toFixed(2)}&nbsp;·&nbsp;{data.method}
        </span>}
        {requestType === 'refund' && <span className="dimmed text-small">
            &nbsp;{formatAmount(data?.amount)}{!!data?.action && <>&nbsp;·&nbsp;{data.action}</>}
        </span>}
        {!!credits && <span className="dimmed text-small">&nbsp;{credits}</span>}
        {requestType === 'allowance-reset' && data?.burned > 0 && <span className="dimmed text-small">
            &nbsp;·&nbsp;{formatWithAutoPrecision(data.burned)} unused burned
        </span>}
    </>
}

/**
 * How an entry moved the balance, signed and named. Null for the entries that leave it alone
 * @param {String} requestType
 * @param {{credits: Number}} [data]
 * @return {String|null}
 * @private
 */
function describeBalanceChange(requestType, data) {
    const credits = data?.credits
    if (!credits)
        return null
    //a charge and a burn store the size of what left
    const change = creditingTypes.includes(requestType) ? credits : -credits
    const unit = Math.abs(change) === 1 ? 'credit' : 'credits'
    return `${change > 0 ? '+' : ''}${formatWithAutoPrecision(change)} ${unit}`
}