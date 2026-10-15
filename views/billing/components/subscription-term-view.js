import React from 'react'

/**
 * Progress bar showing how much of a paid term is spent. A plan with no term renders it empty
 * @param {Number} [from]
 * @param {Number} [to]
 */
export default function SubscriptionTermView({from, to}) {
    const elapsed = to > from ? Math.min(100, Math.max(0, (Date.now() - from) / (to - from) * 100)) : 0
    return <div className="billing-progress nano-space">
        <div style={{width: `${elapsed}%`}}/>
    </div>
}