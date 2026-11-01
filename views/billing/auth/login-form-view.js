import React, {useCallback, useEffect, useState} from 'react'
import {Button, navigation, parseQuery} from '@stellar-expert/ui-framework'
import {completeSignIn, getRoles, isSignedIn, onSignInElsewhere, requestSignInLink}
    from '../../../business-logic/billing/billing-session'
import {isValidEmail} from '../../../business-logic/billing/email'
import {resolveReturnPath} from '../../../business-logic/billing/return-path'
import SegmentLoader from '../utils/segment-loader-view'
import {useSession} from './session-context'
import {AuthScreenView, FieldView, fail} from './auth-form'

const screens = {
    form: {title: 'Sign in'},
    sent: {title: 'Check your inbox', textFirst: true},
    verifying: {title: 'Signing in'},
    failed: {title: 'Sign-in link expired', textFirst: true}
}

/**
 * Passwordless sign-in: ask for an address, mail a link, and sign in when the link is opened. Registering
 * is the same - the first sign-in creates the account
 * @return {JSX.Element}
 */
export default function LoginFormView() {
    //only a dashboard page wraps the form in a session provider - the /login page has none
    const {reload} = useSession()
    //a mailed link opens this page with the token in the query
    const [linkToken] = useState(() => parseQuery().token || null)
    const [screen, setScreen] = useState(linkToken ? 'verifying' : 'form')
    const [email, setEmail] = useState('')
    const [isProgress, setIsProgress] = useState(false)

    const proceed = useCallback(() => {
        if (reload) {
            //shown in place of a dashboard page, which is where the visitor was going - a checkout link from
            //the pricing page, say - so the page stays and only the session catches up
            reload()
        } else {
            navigation.navigate(resolveReturnPath(getRoles().includes('admin') ? '/admin' : '/account'))
        }
    }, [reload])

    const sendLink = useCallback(async () => {
        setIsProgress(true)
        try {
            //the page to come back to travels inside the link, since it opens in a tab of its own
            const returnTo = reload ?
                window.location.pathname + window.location.search :
                resolveReturnPath(undefined)
            await requestSignInLink({email, returnTo})
            //the first request answers with a screen, a repeat with a toast
            if (screen === 'sent') {
                notify({type: 'success', message: 'Sign-in link sent again'})
            } else {
                setScreen('sent')
            }
        } catch (e) {
            fail(e.message || 'Something went wrong. Please try again.')
        } finally {
            setIsProgress(false)
        }
    }, [email, screen, reload])

    const submit = useCallback(e => {
        e?.preventDefault()
        //validation goes to a toast, which does not change the height of the form
        if (!isValidEmail(email))
            return fail('Enter your email address.')
        sendLink()
    }, [email, sendLink])

    const switchTo = useCallback(next => e => {
        e?.preventDefault()
        setScreen(next)
    }, [])

    //the link was opened: spend it, and keep it out of the address bar and the history
    useEffect(() => {
        if (!linkToken)
            return
        navigation.updateQuery({token: undefined})
        completeSignIn(linkToken)
            .then(proceed)
            .catch(e => {
                setScreen('failed')
                fail(e.message || 'Could not sign in. Please request a new link.')
            })
    }, [])

    //the link is usually opened in another tab - this one follows it in
    useEffect(() => {
        if (screen !== 'sent')
            return
        return onSignInElsewhere(proceed)
    }, [screen, proceed])

    //nothing to sign in to - the dashboard is already reachable
    useEffect(() => {
        if (isSignedIn() && !reload && !linkToken) {
            navigation.navigate(resolveReturnPath('/account'))
        }
    }, [])

    if (screen === 'verifying')
        return <AuthScreenView title={screens.verifying.title}>
            <SegmentLoader/>
        </AuthScreenView>

    if (isSignedIn())
        return null

    const {title, textFirst} = screens[screen]
    return <AuthScreenView title={title} textFirst={textFirst}>
        {screen === 'sent' ?
            <InboxView email={email} disabled={isProgress} onResend={sendLink} onBack={switchTo('form')}/> :
            <>
                {screen === 'failed' ? <p className="dimmed text-small">
                    The link has expired or has already been used. Enter your email address to get a new one.
                </p> : null}
                <form onSubmit={submit} className="double-space">
                    <FieldView title="Email address">
                        <input type="email" name="email" value={email} autoComplete="email" autoFocus
                               disabled={isProgress} onChange={e => setEmail(e.target.value.trim())}/>
                    </FieldView>
                    <div className="space">
                        <Button type="submit" disabled={isProgress} block>Email me a sign-in link</Button>
                    </div>
                    <div className="billing-login-footer text-small">
                        <div className="dimmed">
                            No password needed. If you have no account yet, the link creates one - by
                            continuing you accept the <a href="/info/tos">terms of service</a> and{' '}
                            <a href="/info/privacy">privacy policy</a>.
                        </div>
                    </div>
                </form>
            </>}
    </AuthScreenView>
}

/**
 * Shown once the link is on its way
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
            A sign-in link is on its way to <b>{email}</b>. It works once, and expires in an hour.
        </div>
        <p className="dimmed text-small">
            Open it in this browser and this page continues by itself. Nothing after a minute or two? Check
            the spam folder, or send it again.
        </p>
        <div className="space">
            <Button outline disabled={disabled} onClick={onResend} block>Send again</Button>
        </div>
        <div className="billing-login-footer text-small">
            <div><a href="#" onClick={onBack}>Use another address</a></div>
        </div>
    </>
}
