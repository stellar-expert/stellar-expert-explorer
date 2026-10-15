import React, {useCallback, useState} from 'react'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useSession} from '../auth/auth-session'
import {maxApiKeys} from '../components/user-apikeys-view'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'

/**
 * Issues another API key. The page renders it only while the account may hold one more
 * @param {Function} onUpdate - called with the new key list
 * @return {JSX.Element}
 */
export default function ApiKeyGenerationView({onUpdate}) {
    const {userId} = useSession()
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)

    const generateKey = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${userId}/api-key`, {method: 'POST'})
            .then(res => {
                onUpdate(res.apiKeys)
                notify({type: 'success', message: 'New API key has been generated successfully'})
                toggleDialog()
            })
            .catch(err => notify({type: 'error', message: err.message}))
            .finally(() => setIsProgress(false))
    }, [userId, onUpdate, toggleDialog])

    return <>
        <a href="#" onClick={toggleDialog} className="billing-token billing-token-add text-small">
            + Generate API key</a>
        {isOpen && <ActionDialogView title="API key generation" confirmTitle="Generate"
                                     disabled={isProgress} onConfirm={generateKey} onCancel={toggleDialog}>
            <div className="space">
                Our service generates a new API key for you, which you can use right away.
                You can have up to {maxApiKeys} active API keys.
            </div>
        </ActionDialogView>}
    </>
}