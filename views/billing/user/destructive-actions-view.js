import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {signOut} from '../../../business-logic/billing/billing-session'
import {useSession} from '../auth/auth-session'
import {confirmAction} from '../utils/confirm-action'

/**
 * Irreversible account operations, kept together and away from the rest of the settings
 * @return {JSX.Element}
 */
export default function DestructiveActionsView() {
    const {userId} = useSession()
    const [isProgress, setIsProgress] = useState(false)

    const signOutEverywhere = useCallback(async () => {
        if (!await confirmAction('Sign out everywhere? Every browser signed in to this account, this one ' +
            'included, has to sign in again.'))
            return
        setIsProgress(true)
        apiRequest(`account/${userId}/sign-out-everywhere`, {method: 'POST'})
            .then(() => signOut())
            .catch(err => notify({type: 'error', message: 'Failed to sign out everywhere. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [userId])

    const deleteAccount = useCallback(async () => {
        if (!await confirmAction('Delete the account? The subscription is cancelled immediately with no refund, ' +
            'its API keys stop working and the credits are burned.'))
            return
        setIsProgress(true)
        apiRequest(`account/${userId}`, {method: 'DELETE'})
            .then(() => signOut())
            .catch(err => notify({type: 'error', message: 'Failed to delete your account. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [userId])

    return <div className="card double-space billing-card billing-danger">
        <div className="billing-danger-title">Destructive actions</div>
        <DangerRowView title="Sign out everywhere" action="Sign out" disabled={isProgress}
                       onAction={signOutEverywhere}
                       description="Ends every session of this account in every browser, this one included. Your API
                                    keys keep working."/>
        <DangerRowView title="Delete account" action="Delete account" disabled={isProgress} onAction={deleteAccount}
                       description="The subscription is cancelled immediately with no refund for the unused time,
                                    every API key stops working and the remaining credits are burned. Signing in
                                    again offers to restore the account, but the subscription and the credits do
                                    not come back."/>
    </div>
}

/**
 * One irreversible operation, inside a `billing-danger` card
 * @param {String} title
 * @param {String} description
 * @param {String} action - button caption
 * @param {Boolean} [disabled]
 * @param {Function} onAction
 * @return {JSX.Element}
 */
export function DangerRowView({title, description, action, disabled, onAction}) {
    return <div className="billing-danger-row dual-layout">
        <div>
            <strong>{title}</strong>
            <div className="dimmed text-small">{description}</div>
        </div>
        <Button outline small disabled={disabled} onClick={onAction} className="billing-danger-action">{action}</Button>
    </div>
}