import React, {useCallback, useMemo, useState} from 'react'
import {Button, CodeBlock, CopyToClipboard} from '@stellar-expert/ui-framework'
import settings from '../../../app-settings'
import ApiEndpointView from '../api-endpoint-view'
import ApiStatusBadge from '../api-status-badge'
import ApiPlaygroundParametersView from './api-playground-parameters-view'
import buildRequestString, {defaultParamValue, validateParams} from './api-request-builder'
import ApiCallCostView, {isEstimateParam} from './api-call-cost-view'

//kept in memory only, so the key survives navigation between endpoints but never lands in the browser storage
let sessionApiKey = ''

export default function ApiPlaygroundView({operation}) {
    const {method, path, parameters: params = []} = operation
    //"estimate" is driven by the cost widget, not by the caller - keep it out of the request the playground composes
    const callParams = useMemo(() => params.filter(param => !isEstimateParam(param)), [params])
    const [requestParams, setRequestParams] = useState(() => initParams(callParams))
    const [apiKey, setApiKey] = useState(sessionApiKey)
    const [inProgress, setInProgress] = useState(false)
    const [result, setResult] = useState(null)
    const paid = params.some(isEstimateParam)
    const requestString = buildRequestString(path, callParams, requestParams)
    const url = settings.apiEndpoint + requestString
    const isValid = validateParams(callParams, requestParams)

    const updateParam = useCallback((name, value) => setRequestParams(prev => ({...prev, [name]: value})), [])
    const updateApiKey = useCallback(e => {
        sessionApiKey = e.target.value.trim()
        setApiKey(sessionApiKey)
    }, [])

    const onSend = useCallback(() => {
        setInProgress(true)
        const started = performance.now()
        fetch(url, {headers: apiKey ? {Authorization: 'Bearer ' + apiKey} : undefined})
            .then(async resp => setResult({
                status: resp.status,
                statusText: resp.statusText,
                body: await readResponseBody(resp),
                elapsed: Math.round(performance.now() - started)
            }))
            .catch(e => {
                window.notify({type: 'error', message: e.message || 'Unable to get a response'})
                setResult(null)
            })
            .finally(() => setInProgress(false))
    }, [url, apiKey])
    const clearResult = useCallback(() => setResult(null), [])

    return <div className="segment api-panel api-playground">
        <div className="api-panel-header">
            <h3>Try it</h3>
            <span className="dimmed text-tiny">Runs against the live API</span>
        </div>
        <ApiEndpointView method={method} path={path} compact/>
        <ApiPlaygroundParametersView params={callParams} values={requestParams} onChange={updateParam}/>
        <div className="api-request-url">
            <div className="api-caption dual-layout">
                <span>Request URL</span>
                <CopyToClipboard text={url} title="Copy request URL"/>
            </div>
            <code>{url}</code>
        </div>
        <ApiCallCostView params={params} requestString={requestString} enabled={isValid}/>
        <div className="api-playground-group">
            <div className="api-caption">Authorization</div>
            <div className="api-playground-label">
                <span className="api-field-name">API key</span>
                <span className="api-type">Bearer token</span>
            </div>
            <input type="password" value={apiKey} onChange={updateApiKey} placeholder="Paste a key from your dashboard"
                   autoComplete="off" spellCheck={false}/>
            <div className="api-playground-hint text-tiny dimmed">
                {paid ?
                    'This is a paid endpoint. A call without a key or a registered origin is refused with 402.' :
                    'Optional for free endpoints - a key raises the request rate limit.'}
            </div>
        </div>
        <div className="api-playground-actions">
            <Button disabled={!isValid || inProgress} loading={inProgress} onClick={onSend}>
                <i className="icon icon-arrow-right-circle"/> Send request
            </Button>
            <CopyCurlView url={url} apiKey={apiKey}/>
        </div>
        {!!result && <div className="api-playground-result">
            <div className="api-caption dual-layout">
                <span>Response <ApiStatusBadge code={result.status}/> {result.statusText} <span className="dimmed">· {result.elapsed} ms</span></span>
                <a href="#" onClick={clearResult} title="Clear response"><i className="icon icon-cancel"/></a>
            </div>
            <CodeBlock lang="json">{result.body}</CodeBlock>
        </div>}
    </div>
}

function initParams(params) {
    return params.reduce((prev, param) => {
        const defaultValue = defaultParamValue(param)
        if (defaultValue !== '') {
            prev[param.name] = defaultValue
        }
        return prev
    }, {})
}

async function readResponseBody(resp) {
    const contentType = resp.headers.get('content-type') || ''
    if (contentType.includes('json')) {
        const text = await resp.text()
        try {
            return JSON.stringify(JSON.parse(text), null, 2)
        } catch (e) {
            return text
        }
    }
    if (contentType.startsWith('text/'))
        return await resp.text()
    const blob = await resp.blob()
    return `${contentType || 'binary response'} (${blob.size} bytes)`
}

function CopyCurlView({url, apiKey}) {
    const [copied, setCopied] = useState(false)
    const onClick = useCallback(() => setCopied(true), [])
    const onMouseEnter = useCallback(() => setCopied(false), [])
    const command = 'curl ' + (apiKey ? `-H 'Authorization: Bearer ${apiKey}' ` : '') + `'${url}'`

    return <CopyToClipboard text={command}>
        <Button outline onClick={onClick} onMouseEnter={onMouseEnter}>
            <i className={copied ? 'icon icon-ok' : 'icon icon-copy'}/> {copied ? 'Copied' : 'Copy as cURL'}
        </Button>
    </CopyToClipboard>
}
