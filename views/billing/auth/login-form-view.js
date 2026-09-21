import React, {useCallback, useEffect, useState} from 'react'
import {Button, navigation} from '@stellar-expert/ui-framework'
import {getRoles, isSignedIn, logIn, requestPasswordReset, signUp}
    from '../../../business-logic/billing/billing-session'
import {isValidEmail} from '../../../business-logic/billing/email'
import {AuthScreenView, FieldView, PasswordFieldView, checkNewPassword, fail, passwordHint}
    from './auth-form'

const screens = {
    login: {title: 'Authentication', action: 'Sign in'},
    signup: {title: 'Create an account', action: 'Create account'},
    reset: {title: 'Reset your password', action: 'Send reset link', textFirst: true},
    sent: {title: 'Check your inbox', textFirst: true}
}

/**
 * Sign in, register, or start a password reset, all on one screen
 * @return {JSX.Element}
 */
export default function LoginFormView() {
    const [screen, setScreen] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [repeated, setRepeated] = useState('')
    const [isProgress, setIsProgress] = useState(false)

    const isSignUp = screen === 'signup'
    const isReset = screen === 'reset'

    const switchTo = useCallback(next => e => {
        e?.preventDefault()
        setScreen(next)
    }, [])

    //used by the form and by the screen that follows it
    const sendResetLink = useCallback(async () => {
        setIsProgress(true)
        try {
            await requestPasswordReset(email)
            //the first request answers with a screen, a repeat with a toast
            if (screen === 'sent') {
                notify({type: 'success', message: 'Reset link sent again'})
            } else {
                setScreen('sent')
            }
        } catch (e) {
            fail(e.message || 'Something went wrong. Please try again.')
        } finally {
            setIsProgress(false)
        }
    }, [email, screen])

    const submit = useCallback(async e => {
        e?.preventDefault()
        //validation goes to a toast, which does not change the height of the form
        if (!isValidEmail(email))
            return fail('Enter the email address for your account.')
        if (isSignUp) {
            const invalid = checkNewPassword(password, repeated)
            if (invalid)
                return fail(invalid)
        }
        if (screen === 'login' && !password)
            return fail('Enter your password.')

        if (isReset)
            return await sendResetLink()

        setIsProgress(true)
        try {
            await (isSignUp ? signUp : logIn)({email, password})
            const isAdmin = getRoles().includes('admin')
            navigation.navigate(isAdmin ? '/admin' : '/account')
        } catch (e) {
            fail(e.message || 'Something went wrong. Please try again.')
        } finally {
            setIsProgress(false)
        }
    }, [email, password, repeated, screen, isReset, isSignUp, sendResetLink])

    //nothing to sign in to - the dashboard is already reachable
    useEffect(() => {
        if (isSignedIn()) {
            navigation.navigate('/account')
        }
    }, [])

    if (isSignedIn())
        return null

    return <AuthScreenView title={screens[screen].title} textFirst={screens[screen].textFirst}>
        {screen === 'sent' ?
            <InboxView email={email} disabled={isProgress} onResend={sendResetLink}
                       onBack={switchTo('login')}/> :
            <>
                {isReset ? <p className="dimmed text-small">
                    Enter the email on your account and we will send a link to set a new password.
                    The link works once and expires shortly.
                </p> : null}
                <form onSubmit={submit} className="double-space">
                    <FieldView title="Email address">
                        <input type="email" name="email" value={email} autoComplete="username"
                               autoFocus disabled={isProgress}
                               onChange={e => setEmail(e.target.value.trim())}/>
                    </FieldView>
                    {!isReset && <>
                        <PasswordFieldView title="Password" name="password" value={password}
                                           autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                           placeholder={isSignUp ? passwordHint : ''}
                                           disabled={isProgress}
                                           onChange={setPassword}/>
                        {isSignUp ? <PasswordFieldView title="Repeat password" name="repeatPassword"
                                                       value={repeated} autoComplete="new-password"
                                                       disabled={isProgress}
                                                       onChange={setRepeated}/> : null}
                    </>}
                    <div className="space">
                        <Button type="submit" disabled={isProgress} block>
                            {screens[screen].action}
                        </Button>
                    </div>
                    <div className="billing-login-footer text-small">
                        {screen === 'login' && <>
                            <div>No account yet? <a href="#" onClick={switchTo('signup')}>Create an
                                account</a></div>
                            <div><a href="#" onClick={switchTo('reset')}>Forgot your password?</a>
                            </div>
                        </>}
                        {isSignUp ? <>
                            <div>Already have an account? <a href="#" onClick={switchTo('login')}>
                                Sign in</a></div>
                            <div className="dimmed">By creating an account you accept the{' '}
                                <a href="/info/tos">terms of use</a> and{' '}
                                <a href="/info/privacy">privacy policy</a>.</div>
                        </> : null}
                        {isReset ? <>
                            <div>Remembered it? <a href="#" onClick={switchTo('login')}>Sign in</a>
                            </div>
                            <div>No account yet? <a href="#" onClick={switchTo('signup')}>Create an
                                account</a></div>
                        </> : null}
                    </div>
                </form>
            </>}
    </AuthScreenView>
}

/**
 * Shown once the reset mail is on its way
 * @param {String} email
 * @param {Boolean} disabled
 * @param {Function} onResend
 * @param {Function} onBack
 * @return {JSX.Element}
 * @private
 */
function InboxView({email, disabled, onResend, onBack}) {
    return <>
        <div className="billing-login-notice">
            A reset link is on its way to <b>{email}</b>. It works once, and expires shortly.
        </div>
        <p className="dimmed text-small">
            Nothing after a minute or two? Check the spam folder, or send it again.
        </p>
        <div className="space">
            <Button outline disabled={disabled} onClick={onResend} block>Send again</Button>
        </div>
        <div className="billing-login-footer text-small">
            <div><a href="#" onClick={onBack}>Back to sign in</a></div>
        </div>
    </>
}