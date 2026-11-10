import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Button, navigation, parseQuery} from '@stellar-expert/ui-framework'
import {completeSignIn, getRoles, isSignedIn, onSignInElsewhere, requestSignInLink}
    from '../../../business-logic/billing/billing-session'
import {isValidEmail} from '../../../business-logic/billing/email'
import {resolveReturnPath} from '../../../business-logic/billing/return-path'
import TurnstileCaptcha from '../../components/turnstile-captcha'
import SegmentLoader from '../utils/segment-loader-view'
import {useSession} from './session-context'
import {AuthScreenView, fail} from './auth-form'

const screens = {
    form: {title: 'Sign in'},
    sent: {title: 'Check your inbox', textFirst: true},
    verifying: {title: 'Signing in'},
    failed: {title: 'Sign-in link expired', textFirst: true}
}

//the link takes a moment to arrive, and the server limits how many an address may request
const resendCooldown = 60_000

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
    //when the last link went out - "Send again" waits out the cooldown from then
    const [sentAt, setSentAt] = useState(0)
    //every link request spends one anti-bot token - the widget stays mounted to hand out the next one
    const [turnstileToken, setTurnstileToken] = useState('')
    const [turnstileFailed, setTurnstileFailed] = useState(false)
    const turnstile = useRef(null)
    const clearTurnstileToken = useCallback(() => setTurnstileToken(''), [])
    const markTurnstileFailed = useCallback(() => setTurnstileFailed(true), [])

    const proceed = useCallback(session => {
        if (reload) {
            //shown in place of a dashboard page, which is where the visitor was going - a checkout link from
            //the pricing page, say - so the page stays and only the session catches up
            reload()
        } else {
            navigation.navigate(resolveReturnPath(resolveHomePath(session)))
        }
    }, [reload])

    const sendLink = useCallback(async () => {
        setIsProgress(true)
        try {
            //the page to come back to travels inside the link, since it opens in a tab of its own
            const returnTo = reload ?
                window.location.pathname + window.location.search :
                resolveReturnPath(undefined)
            await requestSignInLink({email, returnTo, turnstileToken})
            setSentAt(Date.now())
            //the first request answers with a screen, a repeat with a toast
            if (screen === 'sent') {
                notify({type: 'success', message: 'Sign-in link sent again'})
            } else {
                setScreen('sent')
            }
        } catch (e) {
            fail(e.message || 'Something went wrong. Please try again.')
        } finally {
            setTurnstileToken('')
            turnstile.current?.reset()
            setIsProgress(false)
        }
    }, [email, screen, reload, turnstileToken])

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
    const awaitsTurnstile = !turnstileToken
    return <AuthScreenView title={title} textFirst={textFirst}>
        {screen === 'sent' ?
            <InboxView email={email} disabled={isProgress || awaitsTurnstile} resendAt={sentAt + resendCooldown} onResend={sendLink}
                       onBack={switchTo('form')}/> :
            <>
                {screen === 'failed' ? <p className="dimmed text-small">
                    The link has expired or has already been used. Enter your email address to get a new one.
                </p> : null}
                <form onSubmit={submit} className="space">
                    <label className="dimmed">
                        Email address
                        <input type="email" name="email" value={email} autoComplete="email" autoFocus className="micro-space"
                               placeholder="Provide your email address"
                               disabled={isProgress} onChange={e => setEmail(e.target.value.trim())}/>
                    </label>
                    <div className="space">
                        <Button type="submit" disabled={isProgress || awaitsTurnstile} block>Send me a sign-in link</Button>
                    </div>
                    <div className="billing-login-footer text-tiny">
                        <div className="dimmed">
                            No password needed. A new account will be created if you don't have one.
                            <br/>
                            By continuing you accept the <a href="/info/tos">terms of service</a> and{' '}
                            <a href="/info/privacy">privacy policy</a>.
                        </div>
                    </div>
                </form>
            </>}
        <TurnstileCaptcha ref={turnstile} action="sign-in-link" appearance="interaction-only" className="space"
                          onVerify={setTurnstileToken} onExpire={clearTurnstileToken} onError={markTurnstileFailed}/>
        {!!turnstileFailed && <div className="micro-space color-warning text-small">
            Failed to load the anti-bot check. Please disable content blockers for this page and try again.
        </div>}
    </AuthScreenView>
}

/**
 * Where a sign-in lands when nothing asked to return anywhere - an account without a plan is offered one
 * @param {StoredSession} [session] - the session just started
 * @return {String}
 * @private
 */
function resolveHomePath(session) {
    if (getRoles().includes('admin'))
        return '/admin'
    //null rather than absent: only a server that reports the plan can say there is none
    if (session?.account?.plan === null)
        return '/account/subscription/change'
    return '/account'
}

/**
 * Shown once the link is on its way
 * @param {String} email
 * @param {Boolean} disabled
 * @param {Number} resendAt - epoch ms when "Send again" unlocks
 * @param {Function} onResend
 * @param {Function} onBack
 * @return {JSX.Element}
 * @private
 */
function InboxView({email, disabled, resendAt, onResend, onBack}) {
    const secondsLeft = useSecondsLeft(resendAt)
    return <>
        <div className="billing-login-notice">
            A sign-in link is on its way to <b>{email}</b>. It works once, and expires in an hour.
        </div>
        <p className="dimmed text-small">
            Open it in this browser and this page continues by itself. Nothing after a minute or two? Check
            the spam folder, or send it again.
        </p>
        <div className="space">
            <Button outline disabled={disabled || secondsLeft > 0} onClick={onResend} block>
                {secondsLeft > 0 ? `Send again in ${secondsLeft}s` : 'Send again'}
            </Button>
        </div>
        <div className="billing-login-footer text-small">
            <div><a href="#" onClick={onBack}>Use another address</a></div>
        </div>
    </>
}

/**
 * Whole seconds left until a moment, re-rendering every second until it comes
 * @param {Number} until - epoch ms
 * @return {Number}
 * @private
 */
function useSecondsLeft(until) {
    const [now, setNow] = useState(Date.now)
    useEffect(() => {
        setNow(Date.now())
        if (until <= Date.now())
            return
        const timer = setInterval(() => {
            const current = Date.now()
            setNow(current)
            if (current >= until) {
                clearInterval(timer)
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [until])
    return Math.max(0, Math.ceil((until - now) / 1000))
}
