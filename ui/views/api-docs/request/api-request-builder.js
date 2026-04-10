import {stringifyQuery} from '@stellar-expert/navigation/src/query'

export default function buildRequestString(path, params = [], requestParams = {}) {
    const pathString = addPathParams(path, params, requestParams)
    const queryString = addQueryParams(params, requestParams)

    return pathString + queryString
}

function addPathParams(path, params, requestParams) {
    let result = path
    params.filter(p => p.in === 'path').forEach(p => {
        if (requestParams[p.name]) {
            result = result.replace(`{${p.name}}`, requestParams[p.name])
        }
    })
    return result
}

function addQueryParams(params, requestParams) {
    const inQuery = params.filter(p => p.in === 'query').reduce((prev, current) => {
        if (requestParams[current.name]) {
            prev[current.name] = requestParams[current.name]
        }
        return prev
    }, {})
    return stringifyQuery(inQuery) || ''
}