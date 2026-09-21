import React, {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import SimplePageLayout from '../layout/simple-page-layout'

/**
 * Everything shared by the screens that ask for credentials - signing in, registering, and choosing a
 * password for an account staff created
 */

const minPasswordLength = 8

export const passwordHint = `At least ${minPasswordLength} characters`

/**
 * Report a failure
 * @param {String} message
 */
export function fail(message) {
    notify({type: 'error', message})
}

/**
 * Check a password somebody is choosing right now, against the repeat they typed under it
 * @param {String} password
 * @param {String} repeated
 * @return {String|null} - what is wrong with it, or null when nothing is
 */
export function checkNewPassword(password, repeated) {
    if (password.length < minPasswordLength)
        return `Use at least ${minPasswordLength} characters for your password.`
    if (password !== repeated)
        return 'Both passwords have to match.'
    return null
}

/**
 * The card a credentials screen sits in
 * @param {String} title
 * @param {Boolean} [textFirst] - the body opens with copy rather than with the form
 * @param {*} children
 * @return {JSX.Element}
 */
export function AuthScreenView({title, textFirst, children}) {
    return <div className={`container billing-login${textFirst ? ' text-first' : ''}`}>
        <div className="billing-login-form">
            <SimplePageLayout title={title}>
                {children}
            </SimplePageLayout>
        </div>
    </div>
}

/**
 * Choosing a password
 * @param {String} action - title of the submit button
 * @param {Function} submit - called with the chosen password
 * @return {JSX.Element}
 */
export function NewPasswordFormView({action, submit}) {
    const [password, setPassword] = useState('')
    const [repeated, setRepeated] = useState('')
    const [isProgress, setIsProgress] = useState(false)

    const onSubmit = useCallback(async e => {
        e?.preventDefault()
        const invalid = checkNewPassword(password, repeated)
        if (invalid)
            return fail(invalid)
        setIsProgress(true)
        try {
            await submit(password)
        } catch (e) {
            fail(e.message || 'Something went wrong. Please try again.')
        } finally {
            setIsProgress(false)
        }
    }, [password, repeated, submit])

    return <form onSubmit={onSubmit} className="double-space">
        <PasswordFieldView title="New password" name="password" value={password}
                           autoComplete="new-password" autoFocus disabled={isProgress}
                           placeholder={passwordHint} onChange={setPassword}/>
        <PasswordFieldView title="Repeat password" name="repeatPassword" value={repeated}
                           autoComplete="new-password" disabled={isProgress} onChange={setRepeated}/>
        <div className="space">
            <Button type="submit" disabled={isProgress} block>{action}</Button>
        </div>
    </form>
}

/**
 * One labelled input
 * @param {String} title
 * @param {*} children - the input itself
 * @return {JSX.Element}
 */
export function FieldView({title, children}) {
    return <div className="space">
        <label>
            {title}
            {children}
        </label>
    </div>
}

/**
 * A password field with its own show/hide control
 * @param {String} title
 * @param {String} name
 * @param {String} value
 * @param {String} autoComplete
 * @param {String} [placeholder]
 * @param {Boolean} [autoFocus]
 * @param {Boolean} disabled
 * @param {Function} onChange - called with the new value
 * @return {JSX.Element}
 */
export function PasswordFieldView({title, name, value, autoComplete, placeholder, autoFocus, disabled, onChange}) {
    const [isVisible, setIsVisible] = useState(false)
    const input = useRef(null)
    const caret = useRef(null)

    useLayoutEffect(() => {
        if (caret.current === null)
            return
        input.current?.setSelectionRange(caret.current, caret.current)
        caret.current = null
    }, [isVisible])

    const toggle = useCallback(e => {
        e.preventDefault()
        caret.current = input.current?.selectionStart ?? null
        setIsVisible(visible => !visible)
    }, [])

    const keepFocus = useCallback(e => e.preventDefault(), [])

    return <FieldView title={title}>
        <div className="billing-password-input">
            <input ref={input} name={name} value={value} type={isVisible ? 'text' : 'password'}
                   autoComplete={autoComplete} disabled={disabled} placeholder={placeholder}
                   autoFocus={autoFocus} onChange={e => onChange(e.target.value)}/>
            <a href="#" className="billing-password-toggle text-small" onMouseDown={keepFocus}
               onClick={toggle}>{isVisible ? 'Hide' : 'Show'}</a>
        </div>
    </FieldView>
}