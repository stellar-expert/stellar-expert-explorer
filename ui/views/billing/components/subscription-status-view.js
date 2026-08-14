import React from 'react'
import cn from 'classnames'

/**
 * Whether a plan is currently serving requests
 * @param {Boolean} isActive
 */
export default function SubscriptionStatusView({isActive}) {
    return <code className={cn('text-tiny billing-badge', {inactive: !isActive})}>
        {isActive ? 'active' : 'not active'}
    </code>
}