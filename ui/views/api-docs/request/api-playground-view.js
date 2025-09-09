import React, {useCallback, useEffect, useState} from 'react'
import {BlockSelect, Button, CodeBlock, CopyToClipboard} from '@stellar-expert/ui-framework'
import {performPlaygroundApiCall} from '../api/api-docs-playground-api-call'
import ApiPlaygroundParametersView from './api-playground-parameters-view'
import buildRequestString from './api-request-builder'
import ApiPlaygroundAuthView from './api-playground-auth-view'

export default function ApiPlaygroundView({path, data = {}}) {
    const {parameters: params} = data
    const [authData, setAuthData] = useState({})
    const [isOpenAuth, setIsOpenAuth] = useState(false)
    const [inProgress, setInProgress] = useState(false)
    const [requestParams, setRequestParams] = useState()
    const [response, setResponse] = useState('')
    const requestString = buildRequestString(path, params, requestParams)
    const isRequiredAuth = !!data.cost

    useEffect(() => {
        if (!params)
            return null
        const requestParamsDefault = params?.reduce((prev, current) => {
            const defaultValue = current.schema.default || (current.schema.enum ? current.schema.enum[0] : null)
            if (defaultValue) {
                prev[current.name] = defaultValue
            }
            return prev
        }, {})
        setRequestParams(requestParamsDefault)
    }, [params])

    const toggleAuth = useCallback(() => setIsOpenAuth(prev => !prev), [])

    const onSend = useCallback(() => {
        if (isRequiredAuth && !authData.selectedApiKey) {
            return toggleAuth()
        }

        setInProgress(true)
        performPlaygroundApiCall(requestString, {authKey: authData?.selectedApiKey})
            .then(res => {
                if (res?.error) {
                    notify({type: 'error', message: res.error || 'Unable to get a response'})
                }
                const responseString = typeof res !== 'object' ? res.toString() : JSON.stringify(res, null, 2)
                setResponse(responseString)
            })
            .finally(() => setInProgress(false))
            .catch(e => notify({type: 'error', message: e.message || 'Unable to get a response'}))
    }, [isRequiredAuth, authData, requestString])

    return <div className="segment">
        <h3>Execute</h3>
        <hr className="flare"/>
        <div className="space">
            <ApiPlaygroundParametersView params={params} updateRequestParam={setRequestParams}/>
            <BlockSelect>
            <pre className="api-invocation">
                {requestString}
            </pre></BlockSelect>
            {isRequiredAuth && <ApiPlaygroundAuthView isOpenAuth={isOpenAuth} toggleAuth={toggleAuth}
                                                   authData={authData} updateAuthData={setAuthData}/>}
            <div className="row micro-space">
                <div className="column column-50">
                    <Button block disabled={inProgress} onClick={onSend} className="micro-space">Try it</Button>
                </div>
                <div className="column column-50">
                    <CopyRequestStringView text={requestString}/>
                </div>
            </div>
            {response && <CodeBlock>{response}</CodeBlock>}
            <hr className="flare"/>
        </div>
    </div>
}

function CopyRequestStringView({text}) {
    const [copied, setCopied] = useState(false)
    const onClick = useCallback(() => setCopied(true), [])
    const onMouseEnter = useCallback(() => setCopied(false), [])

    return <CopyToClipboard text={text} icon={false}>
        <Button block outline={copied} className="micro-space" onClick={onClick} onMouseEnter={onMouseEnter}>
            <i className={copied ? 'icon icon-ok' : 'icon-copy active-icon'}/>&nbsp;
            {copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        </Button>
    </CopyToClipboard>
}