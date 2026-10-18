import React, {useEffect, useState} from 'react'
import {InfoTooltip, InlineProgress} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import settings from '../../../app-settings'

const estimateDelay = 600 //do not quote the price on every keystroke

/**
 * Check whether a parameter is the "quote the price instead of executing the request" switch
 * @param {{}} param - dereferenced parameter descriptor
 * @return {Boolean}
 */
export function isEstimateParam(param) {
    return param.in === 'query' && param.name === 'estimate'
}

/**
 * Price of the API call composed in the playground, re-quoted whenever its arguments change.
 * Renders nothing for a free endpoint - only a paid route declares the "estimate" parameter, and on a free route
 * "estimate" is not a reserved word, so the same request would execute instead of being quoted.
 * @param {Array} params - dereferenced parameters list of the operation
 * @param {String} requestString - relative request path with the query string, exactly as the playground shows it
 * @param {Boolean} enabled - whether every required parameter has a value
 * @return {JSX.Element|null}
 */
export default function ApiCallCostView({params = [], requestString, enabled}) {
    const paid = params.some(isEstimateParam)
    const estimate = useCallCostEstimate(requestString, enabled && paid)
    if (!paid)
        return null

    return <div className="api-call-cost text-small">
        {/*the tooltip icon is absolutely positioned, so it has to sit inside an inline-flow item, not in the flex row*/}
        <span className="api-call-cost-label">Estimated cost<InfoTooltip>
            How many photons (compute units) this call is charged with the arguments set above. The price depends on
            the endpoint and on the arguments - the page size, the number of items in a batch request, the applied
            filters, the requested time range. Quoting the price is free of charge and does not execute the request.
        </InfoTooltip></span>
        <span className="api-call-cost-value">
            {enabled ?
                <EstimateView {...estimate}/> :
                <span className="dimmed">set all required parameters</span>}
        </span>
    </div>
}

function EstimateView({cost, inProgress, error}) {
    if (error)
        return <span className="color-warning">{error}</span>
    if (cost === null)
        return <span className="dimmed">estimating<InlineProgress/></span>
    //keep the previous quote on screen while the next one is in flight instead of blinking the value away
    return <span className={inProgress ? 'dimmed' : undefined}>
        <b>{formatWithAutoPrecision(cost)}</b> {cost === 1 ? 'photon' : 'photons'}
    </span>
}

/**
 * @typedef {{}} CallCostEstimate
 * @property {Number|null} cost - quoted price in photons, null until the first quote arrives
 * @property {Boolean} inProgress - whether a quote is in flight
 * @property {String|null} error - reason the endpoint refused to quote the price
 */

/**
 * @param {String} requestString - relative request path with the query string
 * @param {Boolean} enabled - whether the request is complete enough to be quoted
 * @return {CallCostEstimate}
 */
function useCallCostEstimate(requestString, enabled) {
    const [state, setState] = useState({cost: null, inProgress: false, error: null})

    useEffect(() => {
        if (!enabled) {
            setState({cost: null, inProgress: false, error: null})
            return
        }
        setState(prev => ({...prev, inProgress: true, error: null}))
        const abortController = new AbortController()
        const timer = setTimeout(() => {
            fetchEstimate(requestString, abortController.signal)
                .then(cost => setState({cost, inProgress: false, error: null}))
                .catch(e => {
                    if (e.name === 'AbortError')
                        return //superseded by a newer quote, or the playground is gone
                    setState({cost: null, inProgress: false, error: e.message || 'Failed to estimate the call cost'})
                })
        }, estimateDelay)

        return () => {
            clearTimeout(timer)
            abortController.abort()
        }
    }, [requestString, enabled])

    return state
}

/**
 * Ask the endpoint to quote the request instead of executing it
 * @param {String} requestString - relative request path with the query string
 * @param {AbortSignal} signal - abort signal of the superseding quote
 * @return {Promise<Number>}
 */
async function fetchEstimate(requestString, signal) {
    const resp = await fetch(settings.apiEndpoint + withEstimateParam(requestString), {signal})
    let res
    try {
        res = await resp.json()
    } catch (e) {
        throw new Error(`Failed to estimate the call cost (HTTP ${resp.status})`)
    }
    if (!resp.ok || res?.error)
        throw new Error(res?.error || `Failed to estimate the call cost (HTTP ${resp.status})`)
    if (typeof res.cost !== 'number')
        throw new Error('The endpoint did not quote the call cost')
    return res.cost
}

function withEstimateParam(requestString) {
    return requestString + (requestString.includes('?') ? '&' : '?') + 'estimate'
}
