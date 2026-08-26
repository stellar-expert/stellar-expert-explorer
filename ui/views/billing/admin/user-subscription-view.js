import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import SubscriptionSummaryView from '../components/subscription-summary-view'

/**
 * The plan an account is on, and the ways staff can act on it
 * @param {{}} account
 * @param {Function} onUpdate - applies the stored record to the page state
 * @param {Boolean} [disabled]
 * @return {JSX.Element}
 */
export default function UserSubscriptionView({account, onUpdate, disabled}) {
    const subscription = account?.subscription
    const isPaused = subscription?.autoRenew === false
    const [isProgress, setIsProgress] = useState(false)

    const toggleRenewal = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${account.id}/subscription/renewal`, {
            method: 'POST',
            params: {autoRenew: isPaused}
        })
            .then(res => {
                onUpdate(prev => ({...prev, subscription: res.subscription}))
                notify({type: 'success', message: `Automatic renewal has been ${isPaused ? 'resumed' : 'cancelled'}`})
            })
            .catch(error => notify({type: 'error', message: 'Failed to update renewal. ' + error?.message}))
            .finally(() => setIsProgress(false))
    }, [account, isPaused, onUpdate])

    return <div>
        <SubscriptionSummaryView account={account}/>
        <div className="billing-subscription-actions space">
            <Button stackable small href={`/admin/user/${account?.id}/subscription`}>
                {subscription ? 'Change subscription' : 'Subscribe user'}</Button>
            {!!subscription && <Button stackable small outline disabled={disabled || isProgress}
                                       onClick={toggleRenewal}>
                {isPaused ? 'Resume renewal' : 'Cancel renewal'}</Button>}
        </div>
    </div>
}