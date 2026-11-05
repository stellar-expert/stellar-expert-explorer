import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {startImpersonation} from '../../../business-logic/billing/impersonation'
import {confirmAction} from '../utils/confirm-action'
import {DangerRowView} from '../user/destructive-actions-view'
import SettingsSectionView from '../layout/settings-section-view'

/**
 * Acting as the account owner, and closing or restoring the account
 * @param {Account} account
 * @param {Function} onReload - re-read the account once it has been closed or restored
 * @return {JSX.Element}
 */
export default function UserAccountActionsView({account, onReload}) {
    const [isProgress, setIsProgress] = useState(false)
    const userId = account.id

    const logInAs = useCallback(() => {
        setIsProgress(true)
        apiRequest(`auth/login-as`, {
            method: 'POST',
            params: {userId}
        })
            .then(res => {
                startImpersonation(res.accessToken)
                location.href = '/account'
            })
            .catch(e => {
                notify({type: 'warning', message: e.message})
                setIsProgress(false)
            })
    }, [userId])

    //deletion only deactivates, so the same action restores
    const toggleAccount = useCallback(async () => {
        const restoring = !!account.inactive
        if (!await confirmAction(`${restoring ? 'Restore' : 'Delete'} this account?`))
            return
        setIsProgress(true)
        const request = restoring ?
            apiRequest(`account/${userId}/restore`, {method: 'POST'}) :
            apiRequest(`account/${userId}`, {method: 'DELETE'})
        request
            .then(onReload)
            .catch(e => notify({type: 'warning', message: e.message}))
            .finally(() => setIsProgress(false))
    }, [userId, account.inactive, onReload])

    return <>
        <SettingsSectionView title="Access" description="Open the dashboard as the account owner sees it.">
            <Button small outline disabled={isProgress || account.inactive} onClick={logInAs}>Log in as</Button>
        </SettingsSectionView>
        <div className="card double-space billing-card billing-danger">
            <div className="billing-danger-title">Destructive actions</div>
            {account.inactive ?
                <DangerRowView title="Restore account" action="Restore account" disabled={isProgress}
                               onAction={toggleAccount}
                               description="Reopens the account and its API keys. The credits burned on deletion do not
                                            come back."/> :
                <DangerRowView title="Delete account" action="Delete account" disabled={isProgress}
                               onAction={toggleAccount}
                               description="A Paddle subscription is cancelled immediately with no refund, every API key
                                            stops working and the remaining credits are burned. The account can be
                                            restored later."/>}
        </div>
    </>
}
