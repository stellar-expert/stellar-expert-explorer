import {navigation} from '@stellar-expert/ui-framework'
import {session} from '../../views/billing/auth/auth-session'
import appSettings from '../../app-settings'

let unauthorizedRedirected = false

/**
 * Recover from a rejected bearer token
 * @private
 */
function handleUnauthorized() {
    localStorage.removeItem('loginAsToken')
    if (unauthorizedRedirected || window.location.pathname === '/login')
        return
    unauthorizedRedirected = true
    navigation.navigate('/login')
}

/**
 *
 * @param {string} endpointWithQuery
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [method]
 * @param {boolean} [auth]
 * @param {{}} [params]
 * @return {Promise<*|{error: string}>}
 */
export async function performApiCall(endpointWithQuery, {method = 'GET', auth = true, params} = {}) {
    const url = `${appSettings.billingApiEndpoint}/${endpointWithQuery}`
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    if (auth && session.getToken) {
        const loginAsToken = localStorage.getItem('loginAsToken')
        const token = loginAsToken || await session.getToken()
        headers.Authorization = 'Bearer ' + token
    }
    try {
        const resp = await fetch(url, {
            headers,
            method,
            body: params ? JSON.stringify(params) : undefined
        })
        if (!resp.ok) {
            if (resp.status === 401) {
                handleUnauthorized()
            }
            let errorExt
            try {
                errorExt = await resp.json()
            } catch (parsingError) {
                errorExt = {}
            }
            const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
            err.status = resp.status
            err.ext = errorExt
            throw err
        }
        return await resp.json()
    } catch (e) {
        const failure = e instanceof Error ? {
            error: e.message,
            status: e.status || 500,
            ext: e.ext
        } : e
        if (failure.ext && failure.ext.status) {
            failure.status = failure.ext.status
        }
        return failure
    }
}

/**
 * Same as `performApiCall`, but rejects on failure instead of resolving with an `{error}` envelope
 * @param {string} endpointWithQuery
 * @param {{}} [options] - same options accepted by `performApiCall`
 * @return {Promise<*>}
 */
export async function apiRequest(endpointWithQuery, options) {
    const res = await performApiCall(endpointWithQuery, options)
    if (res.error) {
        const err = new Error(res.error)
        //keep the status so callers can react to a specific failure
        err.status = res.status
        throw err
    }
    return res
}