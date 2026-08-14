import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'

/**
 * The limits a plan grants, as a row of accented figures
 * @param {{photons: Number, requestsPerMinute: Number, batchSize: Number}} limits
 * @param {String} support
 * @param {Boolean} [custom] - limits agreed per customer rather than published
 * @return {JSX.Element}
 */
export default function PlanLimitsView({limits, support, custom}) {
    const entries = [
        {value: limits?.photons, caption: 'PHOTONS/MONTH'},
        {value: limits?.requestsPerMinute, caption: 'REQUESTS/MINUTE'},
        {value: limits?.batchSize, caption: 'ITEMS/BATCH RESPONSE'},
        {value: support, caption: 'SUPPORT', text: true}
    ]

    return <div className="row billing-limits">
        {entries.map(({value, caption, text}) => <div key={caption} className="column column-25">
            <div className="billing-limit">
                <div className="billing-limit-value">{formatLimit(value, custom, text)}</div>
                <div className="dimmed text-tiny">{caption}</div>
            </div>
        </div>)}
    </div>
}

/**
 * @param {Number|String} value
 * @param {Boolean} [custom]
 * @param {Boolean} [text] - already a label, not a number to format
 * @return {String}
 * @private
 */
function formatLimit(value, custom, text) {
    if (text)
        return value || '—'
    if (custom)
        return 'Custom'
    if (!value)
        return '—'
    return formatWithAutoPrecision(value)
}