import React from 'react'

/**
 * Indicator showing how much of a paid term is already spent
 * @param {Number} from
 * @param {Number} to
 */
export default function SubscriptionTermView({from, to}) {
    if (!(to > from))
        return null
    const elapsed = Math.min(100, Math.max(0, (Date.now() - from) / (to - from) * 100))
    return <div className="billing-progress nano-space">
        <div style={{width: `${elapsed}%`}}/>
    </div>
}