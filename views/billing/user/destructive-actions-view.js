import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {signOut} from '../../../business-logic/billing/billing-session'
import {useSession} from '../auth/auth-session'
import {confirmAction} from '../utils/confirm-action'

/**
 * Irreversible account operations, kept together and away from the rest of the settings
 * @param {Function} [onKeysRevoked] - lets the surrounding page drop the keys it already rendered
 * @return {JSX.Element}
 */
export default function DestructiveActionsView({onKeysRevoked}) {
    const {userId} = useSession()
    const [isProgress, setIsProgress] = useState(false)

    const revokeKeys = useCallback(async () => {
        if (!await confirmAction('Revoke every API key? Applications using them stop working immediately.'))
            return
        setIsProgress(true)
        apiRequest(`account/${userId}/api-key`, {method: 'POST', params: {apiKeys: []}})
            .then(() => {
                onKeysRevoked?.([])
                notify({type: 'success', message: 'All API keys have been revoked'})
            })
            .catch(err => notify({type: 'error', message: 'Failed to revoke API keys. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [userId, onKeysRevoked])

    const deleteAccount = useCallback(async () => {
        if (!await confirmAction('Delete the account? Its API keys stop working and the credits are burned.'))
            return
        setIsProgress(true)
        apiRequest(`account/${userId}`, {method: 'DELETE'})
            .then(() => signOut())
            .catch(() => notify({type: 'error', message: 'Failed to delete your account'}))
            .finally(() => setIsProgress(false))
    }, [userId])

    return <div className="card double-space billing-card billing-danger">
        <div className="billing-danger-title">Destructive actions</div>
        <DangerRowView title="Revoke all API keys" action="Revoke keys" disabled={isProgress} onAction={revokeKeys}
                       description="Every key stops working immediately. Your subscription and usage history are kept."/>
        <DangerRowView title="Delete account" action="Delete account" disabled={isProgress} onAction={deleteAccount}
                       description="Every API key stops working and the remaining credits are burned. Signing in again
                                    offers to restore the account, but the credits do not come back."/>
    </div>
}

/**
 * @param {String} title
 * @param {String} description
 * @param {String} action - button caption
 * @param {Boolean} [disabled]
 * @param {Function} onAction
 * @return {JSX.Element}
 */
function DangerRowView({title, description, action, disabled, onAction}) {
    return <div className="billing-danger-row dual-layout">
        <div>
            <strong>{title}</strong>
            <div className="dimmed text-small">{description}</div>
        </div>
        <Button outline small disabled={disabled} onClick={onAction} className="billing-danger-action">{action}</Button>
    </div>
}