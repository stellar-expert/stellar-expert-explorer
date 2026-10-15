import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {signOut} from '../../../business-logic/billing/billing-session'
import {useSession} from './auth-session'
import {AuthScreenView} from './auth-form'

/**
 * Replaces the dashboard while an account is soft-deleted, offering to bring it back
 * @return {JSX.Element}
 */
export default function AccountRestoreView() {
    const {userId, reload} = useSession()
    const [isProgress, setIsProgress] = useState(false)

    const restore = useCallback(() => {
        setIsProgress(true)
        apiRequest(`account/${userId}/restore`, {method: 'POST'})
            .then(() => {
                notify({type: 'success', message: 'Your account has been restored'})
                reload()
            })
            .catch(e => notify({type: 'error', message: 'Failed to restore the account. ' + e.message}))
            .finally(() => setIsProgress(false))
    }, [userId, reload])

    const logOut = useCallback(e => {
        e.preventDefault()
        signOut()
    }, [])

    return <AuthScreenView title="Account deleted" textFirst>
        <p>
            This account has been deleted. You can restore it right now and keep using the service with
            the same email address - the API keys it had start working again.
        </p>
        <p>
            Credits held at the time of deletion were burned and do not come back.
        </p>
        <div className="space">
            <Button onClick={restore} disabled={isProgress} block>Restore account</Button>
        </div>
        <div className="text-center micro-space">
            <a href="#" onClick={logOut} className="text-small">Log out</a>
        </div>
    </AuthScreenView>
}