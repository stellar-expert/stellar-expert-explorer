import React, {useCallback} from 'react'
import {setPassword} from '../../../business-logic/billing/billing-session'
import {useSession} from './session-context'
import {AuthScreenView, NewPasswordFormView} from './auth-form'

/**
 * Replaces the dashboard until the owner of a staff-created account chooses a password of their own
 * @return {JSX.Element}
 */
export default function SetPasswordView() {
    const {email, reload} = useSession()

    const submit = useCallback(async password => {
        await setPassword(password)
        notify({type: 'success', message: 'Your password has been set'})
        reload()
    }, [reload])

    return <AuthScreenView title="Choose your password" textFirst>
        <p className="dimmed text-small">
            This account was set up for you{email ? <> as <b>{email}</b></> : null}. The password from the
            invitation works for this screen only - pick one of your own to carry on.
        </p>
        <NewPasswordFormView action="Set password" submit={submit}/>
    </AuthScreenView>
}