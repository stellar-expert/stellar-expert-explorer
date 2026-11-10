import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react'
import appSettings from '../../app-settings'

const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptLoading

/**
 * Load the Cloudflare Turnstile script once per page
 * @return {Promise<{}>} - resolves with the `turnstile` global
 */
function loadTurnstile() {
    if (window.turnstile)
        return Promise.resolve(window.turnstile)
    if (!scriptLoading) {
        scriptLoading = new Promise((resolve, reject) => {
            const tag = document.createElement('script')
            tag.src = turnstileScript
            tag.async = true
            tag.onload = () => resolve(window.turnstile)
            tag.onerror = () => {
                //let the next widget retry
                scriptLoading = null
                tag.remove()
                reject(new Error('Failed to load Turnstile script'))
            }
            document.head.appendChild(tag)
        })
    }
    return scriptLoading
}

/**
 * Cloudflare Turnstile widget. Hands out a single-use token that the server checks before acting on the form
 * @param {String} [action] - label Cloudflare attaches to the token, shows up in Turnstile analytics
 * @param {'always'|'interaction-only'} [appearance] - "interaction-only" keeps the widget hidden unless the visitor
 * has to click it
 * @param {Function} onVerify - receives a fresh token
 * @param {Function} [onExpire] - the last token is no longer valid
 * @param {Function} [onError] - the widget failed to load (usually blocked by a content blocker)
 * @param {String} [className]
 * @param {{reset: Function}} [ref] - `reset()` requests a new token once the previous one has been spent
 */
const TurnstileCaptcha = forwardRef(function TurnstileCaptcha({action, appearance = 'always', onVerify, onExpire, onError, className}, ref) {
    const container = useRef(null)
    const widgetId = useRef(null)
    const callbacks = useRef(null)
    callbacks.current = {onVerify, onExpire, onError}

    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetId.current !== null) {
                window.turnstile?.reset(widgetId.current)
            }
        }
    }), [])

    useEffect(() => {
        let disposed = false
        loadTurnstile()
            .then(turnstile => {
                if (disposed || !container.current)
                    return
                widgetId.current = turnstile.render(container.current, {
                    sitekey: appSettings.turnstileKey,
                    action,
                    appearance,
                    size: 'flexible',
                    callback: token => callbacks.current.onVerify?.(token),
                    'expired-callback': () => callbacks.current.onExpire?.(),
                    'timeout-callback': () => callbacks.current.onExpire?.(),
                    'error-callback': () => callbacks.current.onExpire?.()
                })
            })
            .catch(e => {
                console.error(e)
                if (!disposed) {
                    callbacks.current.onError?.(e)
                }
            })
        return () => {
            disposed = true
            if (widgetId.current !== null) {
                try {
                    window.turnstile?.remove(widgetId.current)
                } catch (e) {
                    console.error(e)
                }
                widgetId.current = null
            }
        }
    }, [action, appearance])

    return <div ref={container} className={className}/>
})

export default TurnstileCaptcha
