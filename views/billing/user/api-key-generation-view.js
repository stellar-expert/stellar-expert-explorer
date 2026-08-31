import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useSession} from '../auth/auth-session'
import {maxApiKeys} from '../components/user-apikeys-view'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'

export default function ApiKeyGenerationView({onUpdate, disabled}) {
    const {userId} = useSession()
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)


    const updateBalance = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${userId}/api-key`, {
            method: 'POST'
        })
            .then(res => {
                //refresh user list
                onUpdate(res.apiKeys)
                notify({type: 'success', message: `New API key has been generated successfully`})
                toggleDialog()
            })
            .catch(err => notify({type: 'error', message: err.message}))
            .finally(() => setIsProgress(false))
    }, [userId, onUpdate])

    return <div>
        <Button block small disabled={disabled} onClick={toggleDialog}
                title={disabled ? `You already have ${maxApiKeys} active API keys` : ''}>
            Generate api key
        </Button>
        <ActionDialogView title="API key generation" dialogOpen={isOpen} confirmTitle="Generate"
                          disabled={isProgress} onConfirm={updateBalance} onCancel={toggleDialog}>
            <div className="space">
                Our service generates a new API key for you, which you can use right away.
                You can have up to {maxApiKeys} active API keys.
            </div>
        </ActionDialogView>
    </div>
}