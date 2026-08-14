import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'
import FastValueView from '../utils/fast-value-view'

export default function UserCreditDepositView({account, onUpdate}) {
    const [amount, setAmount] = useState('')
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)
    const userIdentity = account.email || <>#{shortenString(account.id)}</>

    const changeAmount = useCallback(e => setAmount(e.target.value.trim().replace(/[^\d.]/g, '')), [])
    const addFixValue = useCallback(e => setAmount(e.currentTarget.dataset.amount), [])

    const updateBalance = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${account.id}/deposit`, {
            method: 'POST',
            params: {amount}
        })
            .then(() => {
                //refresh user list
                onUpdate()
                notify({type: 'success', message: 'Credits have been added to the balance'})
                toggleDialog()
            })
            .catch(err => notify({type: 'error', message: 'Failed to update balance. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [account, amount, onUpdate])

    return <div className="inline">
        <Button stackable small disabled={account.inactive} onClick={toggleDialog}>Add credits</Button>
        <ActionDialogView title={<>Add credits to {userIdentity}</>} dialogOpen={isOpen}
                          disabled={isProgress || !Number(amount)} onConfirm={updateBalance} onCancel={toggleDialog}>
            <div className="space">
                The credits entered will be added to the user&apos;s current balance.
            </div>
            <div className="space">
                <label className="dimmed text-small">Credits to add</label>
                <input value={amount} placeholder={`${account.balance} credits`} onChange={changeAmount}/>
            </div>
            <FastValueView onClick={addFixValue} className="text-right"/>
        </ActionDialogView>
    </div>
}