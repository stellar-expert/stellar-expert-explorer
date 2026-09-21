import React, {useCallback} from 'react'
import {navigation, parseQuery} from '@stellar-expert/ui-framework'
import {completePasswordReset} from '../../../business-logic/billing/billing-session'
import {AuthScreenView, NewPasswordFormView} from './auth-form'

/**
 * Screen the link in a password reset email opens
 * @return {JSX.Element}
 */
export default function ResetPasswordView() {
    const {token} = parseQuery()

    const submit = useCallback(async password => {
        await completePasswordReset({token, password})
        notify({type: 'success', message: 'Your password has been changed'})
        navigation.navigate('/account')
    }, [token])

    if (!token)
        return <AuthScreenView title="This link is incomplete" textFirst>
            <p className="dimmed text-small">
                Open the link from the email again, or <a href="/login">request a new one</a>. Links stop
                working once they have been used, and expire within the hour either way.
            </p>
        </AuthScreenView>

    return <AuthScreenView title="Choose a new password" textFirst>
        <p className="dimmed text-small">
            Pick a password for your account. This link works once, and you will be signed in with what
            you choose here.
        </p>
        <NewPasswordFormView action="Change password" submit={submit}/>
    </AuthScreenView>
}