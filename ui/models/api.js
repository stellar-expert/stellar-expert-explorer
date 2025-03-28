import {stringifyQuery} from '@stellar-expert/navigation'
import appSettings from '../app-settings'

function handleError(e) {
    console.error(e)
    if (e.ext && e.ext.status) {
        e.status = e.ext.status
    }
    return Promise.reject(e)
}

/**
 * Retrieve data from the server API endpoint.
 * @deprecated Try using useApi() hook whenever is possible.
 * @param {string} relativeApiPath - API endpoint path.
 * @param {object} [data] - Request payload.
 * @param {object} [params] - Request params.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [params.method] - HTTP method to use (GET by default).
 * @param {boolean} [params.includeNetwork] - Whether to include network identifier in request path (true by default).
 * @return {Promise<object>}
 */
function apiCall(relativeApiPath, data, params) {
    params = {method: 'GET', includeNetwork: true, ...params}
    const networkSegment = params.includeNetwork ? appSettings.activeNetwork + '/' : ''
    let fetchParams = {}
    let url = `${explorerApiOrigin}/explorer/${networkSegment}${relativeApiPath}`
    if (params.method && params.method !== 'GET') {
        fetchParams = {
            ...params,
            body: JSON.stringify(data),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        }
    } else {
        url += stringifyQuery(data)
    }
    return fetch(url, fetchParams)
        .then(resp => {
            if (!resp.ok)
                return resp.json()
                    .catch(e => ({}))
                    .then(ext => Promise.reject({
                        error: resp.statusText,
                        status: resp.statusText,
                        ext
                    }))
            return resp.json()
        })
}

export {apiCall}