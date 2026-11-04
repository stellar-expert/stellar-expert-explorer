import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'

/**
 * The address the owner signs in with, and the staff action that moves the account to another one
 * @param {Account} account - the account being edited
 * @param {Function} onUpdate - state setter of the account on the page, so its header follows the change
 * @return {JSX.Element}
 */
export default function UserEmailView({account, onUpdate}) {
    const [email, setEmail] = useState('')
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)

    const openDialog = useCallback(() => {
        setEmail(account.email || '')
        toggleDialog()
    }, [account.email, toggleDialog])

    const changeEmail = useCallback(e => setEmail(e.target.value), [])

    const saveEmail = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${account.id}/email`, {
            method: 'POST',
            params: {email}
        })
            .then(res => {
                onUpdate(prev => ({...prev, email: res.email}))
                notify({type: 'success', message: 'Email has been changed'})
                toggleDialog()
            })
            .catch(err => notify({type: 'error', message: 'Failed to change email. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [account.id, email, onUpdate, toggleDialog])

    //the server stores addresses trimmed and lowercased, so that is what counts as a change
    const normalized = email.trim().toLowerCase()
    const unchanged = !normalized || normalized === account.email

    return <div className="dual-layout">
        <div>{account.email ? <strong>{account.email}</strong> : <span className="dimmed">(No email)</span>}</div>
        <div className="inline">
            <Button stackable small onClick={openDialog}>Change email</Button>
            <ActionDialogView title="Change email" dialogOpen={isOpen} disabled={isProgress || unchanged}
                              onConfirm={saveEmail} onCancel={toggleDialog}>
                <div className="space">
                    The owner signs in with the new address from now on. Sessions already open stay signed in.
                    {!!account.paddle?.customerId && <> The Paddle customer is moved to the new address too, so receipts
                        and invoices follow it.</>}
                </div>
                <div className="space">
                    <label className="dimmed text-small">New email</label>
                    <input type="email" value={email} placeholder={account.email} onChange={changeEmail}/>
                </div>
            </ActionDialogView>
        </div>
    </div>
}
