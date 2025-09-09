import appSettings from '../../../app-settings'

/**
 * Execute SE API call with a specific auth key
 * @param {string} endpointWithQuery
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [method]
 * @param {string} [authKey]
 * @return {Promise<*|{error: string}>}
 */
export async function performPlaygroundApiCall(endpointWithQuery, {method = 'GET', authKey} = {}) {
    let url = `${appSettings.apiEndpoint}${endpointWithQuery}`
    if (!!authKey) {
        const params = new URL(url).search || []
        url += `${params.length ? '&' : '?'}api-key=${authKey}`
    }
    try {
        const resp = await fetch(url, {method})
        if (!resp.ok) {
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
        console.error(e)
        if (e instanceof Error) {
            e = {
                error: e.message,
                status: e.status || 500,
                ext: e.ext
            }
        }
        if (e.ext && e.ext.status) {
            e.status = e.ext.status
        }
        return e
    }
}