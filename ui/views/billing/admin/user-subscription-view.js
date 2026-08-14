import React, {useCallback} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import SubscriptionSummaryView from '../components/subscription-summary-view'

/**
 * The plan an account is on, and the ways staff can act on it
 * @param {{}} account
 * @param {Function} onUpdate
 * @param {Boolean} [disabled]
 * @return {JSX.Element}
 */
export default function UserSubscriptionView({account, onUpdate, disabled}) {
    const subscription = account?.subscription
    const isPaused = subscription?.autoRenew === false

    const toggleRenewal = useCallback(() => {
        onUpdate('subscription', {...subscription, autoRenew: isPaused})
    }, [subscription, isPaused, onUpdate])

    return <div>
        <SubscriptionSummaryView account={account}/>
        <div className="billing-subscription-actions space">
            <Button stackable small href={`/admin/user/${account?.id}/subscription`}>
                {subscription ? 'Change subscription' : 'Subscribe user'}</Button>
            {!!subscription && <Button stackable small outline disabled={disabled} onClick={toggleRenewal}>
                {isPaused ? 'Resume renewal' : 'Cancel renewal'}</Button>}
        </div>
    </div>
}