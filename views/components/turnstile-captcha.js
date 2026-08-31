import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react'

const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const scriptId = 'se-turnstile-script'
const scriptLoadedCallback = 'turnstileLoaded'

export const appendScript = () => {
    const src = `${turnstileScript}?onload=${scriptLoadedCallback}&render=explicit`

    if (document.getElementById(scriptId) || document.querySelector(`script[src="${src}"]`))
        return

    const tag = document.createElement('script')
    tag.id = scriptId
    tag.defer = true
    tag.async = true
    tag.src = src

    document.getElementsByTagName('head')[0].appendChild(tag)
}

function useTurnstileAsyncScriptLoad() {
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        function onScriptLoaded() {
            if (document.getElementById(scriptId)) {
                setLoaded(true)
            }
        }

        const observer = new MutationObserver(onScriptLoaded)
        observer.observe(document, {childList: true, subtree: true})

        onScriptLoaded()

        return () => observer.disconnect()
    })
    return loaded
}


const TurnstileCaptcha = forwardRef(({sitekey}, ref) => {
    if (!sitekey) {
        console.warn('sitekey is missing')
        return null
    }
    const [instanceId, setInstanceId] = useState()
    const [turnstileLoaded, setTurnstileLoaded] = useState(false)
    const containerId = scriptId + '-container'
    const container = useRef(null)
    const scriptLoaded = useTurnstileAsyncScriptLoad()

    const renderConfig = {sitekey, execution: 'execute'}

    useImperativeHandle(ref, () => {
            if (typeof window === 'undefined' || !scriptLoaded)
                return

            const {turnstile} = window
            return {
                getResponse() {
                    if (!turnstile?.getResponse || !instanceId) {
                        console.warn('Turnstile has not been loaded')
                        return
                    }

                    return turnstile.getResponse(instanceId)
                },
                remove() {
                    if (!instanceId)
                        return
                    setInstanceId('')
                    turnstile.remove(instanceId)
                },
                render() {
                    if (instanceId)
                        return
                    const id = turnstile.render(container.current, renderConfig)
                    setInstanceId(id)
                    return id
                },
                execute() {
                    if (!turnstile?.execute || !container.current || !instanceId)
                        return
                    turnstile.execute(container.current, renderConfig)
                }
            }
        },
        [scriptLoaded, instanceId, container.current])

    useEffect(() => {
        window[scriptLoadedCallback] = function () {
            setTurnstileLoaded(true)
        }

        if (!turnstileLoaded) {
            appendScript({
                onLoadCallbackName: scriptLoadedCallback
            })
        }
        return () => {
            delete window[scriptLoadedCallback]
        }
    }, [])

    /* Set the turnstile as loaded, in case the onload callback never runs. (e.g., when manually injecting the script without specifying the `onload` param) */
    /*useEffect(() => {
        if (scriptLoaded && !turnstileLoaded && window.turnstile) {
            setTurnstileLoaded(true)
        }
    }, [turnstileLoaded, scriptLoaded])*/

    useEffect(() => {
        if (!scriptLoaded || !container.current || !turnstileLoaded)
            return

        const id = window.turnstile?.render(container.current, renderConfig)
        setInstanceId(id)
    }, [scriptLoaded, turnstileLoaded, container.current])

    useEffect(() => {
        if (!instanceId)
            return

        return () => {
            try {
                window.turnstile?.remove(instanceId)
            } catch (e) {
                console.error(e)
            }
        }
    }, [instanceId])

    return <div ref={container} id={containerId} style={{width: 0, height: 0, overflow: 'hidden'}}/>
})

export default TurnstileCaptcha
