import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'
import FastValueView from '../utils/fast-value-view'

/**
 * What became of the invitation, as a toast
 * @param {{email: String, invited: Boolean, mailSent: Boolean}} res - as answered by `account` POST
 * @return {{type: String, message: String}}
 * @private
 */
function describeInvitation({email, invited, mailSent}) {
    if (mailSent)
        return {
            type: 'success',
            message: invited ?
                `Account ${email} created - a temporary password is on its way` :
                `Account ${email} created - this address already had a sign-in, so its owner keeps the ` +
                'password they chose'
        }
    return {
        type: 'warning',
        message: `Account ${email} created, but nothing could be mailed to it - its owner has to set a ` +
            'password themselves before they can sign in'
    }
}

export default function NewUserView({onCreate}) {
    const [email, setEmail] = useState('')
    const [balance, setBalance] = useState('')
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)

    const changeEmail = useCallback(e => setEmail(e.target.value.trim()), [])
    const changeBalance = useCallback(e => setBalance(e.target.value.trim().replace(/[^\d.]/g, '')), [])
    const addFixValue = useCallback(e => setBalance(e.currentTarget.dataset.amount), [])

    const updateBalance = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account`, {
            method: 'POST',
            params: {email, balance}
        })
            .then(res => {
                //refresh user list
                onCreate()
                notify(describeInvitation(res))
                toggleDialog()
            })
            .catch(err => notify({type: 'error', message: 'Failed to create account. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [email, balance])

    return <div>
        <Button block small onClick={toggleDialog}>Add new user</Button>
        <ActionDialogView title="Create new account" dialogOpen={isOpen} confirmTitle="Create"
                          disabled={isProgress || !email} onConfirm={updateBalance} onCancel={toggleDialog}>
            <div className="space">
                <label className="dimmed text-small">User email</label>
                <input value={email} onChange={changeEmail}/>
            </div>
            <div className="micro-space">
                <label className="dimmed text-small">Start balance</label>
                <input value={balance} onChange={changeBalance}/>
            </div>
            <FastValueView onClick={addFixValue} className="text-right"/>
        </ActionDialogView>
    </div>
}