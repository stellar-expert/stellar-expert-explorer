import React, {useCallback, useEffect, useState} from 'react'
import {Button, ButtonGroup, CodeBlock, CopyToClipboard} from '@stellar-expert/ui-framework'
import settings from '../../../app-settings'
import ApiPlaygroundParametersView from './api-playground-parameters-view'
import buildRequestString, {defaultParamValue, validateParams} from './api-request-builder'

export default function ApiPlaygroundView({path, params = []}) {
    const [inProgress, setInProgress] = useState(false)
    const [requestParams, setRequestParams] = useState({})
    const [response, setResponse] = useState('')
    const requestString = buildRequestString(path, params, requestParams)
    const isValid = validateParams(params, requestParams)

    useEffect(() => {
        setResponse('')
        setRequestParams(params.reduce((prev, param) => {
            const defaultValue = defaultParamValue(param)
            if (defaultValue !== '') {
                prev[param.name] = defaultValue
            }
            return prev
        }, {}))
    }, [params])

    const onSend = useCallback(() => {
        setInProgress(true)
        fetch(settings.apiEndpoint + requestString)
            .then(parseResponse)
            .then(res => setResponse(res))
            .catch(e => {
                notify({type: 'error', message: e.message || 'Unable to get a response'})
                setResponse('')
            })
            .finally(() => setInProgress(false))
    }, [requestString])

    return <div>
        <div className="dual-layout">
            <h3>Run API request</h3>
        </div>
        <hr/>
        <div className="space">
            {!!params.length && <ApiPlaygroundParametersView params={params} updateRequestParam={setRequestParams}/>}
            <CodeBlock className="space">{requestString}</CodeBlock>
            <ButtonGroup inline>
                <Button disabled={!isValid || inProgress} onClick={onSend} className="micro-space" style={{width: '50%'}}>Try it</Button>
                <CopyRequestStringView text={requestString}/>
            </ButtonGroup>
            {!!response && <CodeBlock>{response}</CodeBlock>}
            <hr className="flare"/>
        </div>
    </div>
}

async function parseResponse(resp) {
    const contentType = resp.headers.get('content-type') || ''
    if (contentType.includes('json')) {
        const res = await resp.json()
        if (!resp.ok || res?.error) {
            notify({type: 'error', message: res?.error || `Request failed (HTTP ${resp.status})`})
        }
        return JSON.stringify(res, null, 2)
    }
    if (contentType.startsWith('text/')) {
        const res = await resp.text()
        if (!resp.ok) {
            notify({type: 'error', message: `Request failed (HTTP ${resp.status})`})
        }
        return res
    }
    if (!resp.ok)
        throw new Error(`Request failed (HTTP ${resp.status})`)
    const res = await resp.blob()
    return `${contentType || 'binary response'} (${res.size} bytes)`
}

function CopyRequestStringView({text}) {
    const [copied, setCopied] = useState(false)
    const onClick = useCallback(() => setCopied(true), [])
    const onMouseEnter = useCallback(() => setCopied(false), [])

    return <CopyToClipboard text={text} icon={false}>
        <Button outline={copied} className="micro-space" onClick={onClick} onMouseEnter={onMouseEnter} style={{width: '50%'}}>
            <i className={copied ? 'icon icon-ok' : 'icon-copy active-icon'}/>&nbsp;
            {copied ? 'Copied' : 'Copy'}
        </Button>
    </CopyToClipboard>
}
