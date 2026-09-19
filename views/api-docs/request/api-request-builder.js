import {stringifyQuery} from '@stellar-expert/ui-framework'

export default function buildRequestString(path, params = [], requestParams = {}) {
    const pathString = addPathParams(path, params, requestParams)
    const queryString = addQueryParams(params, requestParams)

    return pathString + queryString
}

/**
 * Pick the value to prefill a playground parameter control with
 * @param {{}} param - dereferenced parameter descriptor
 * @return {String|Number|Array}
 */
export function defaultParamValue(param) {
    const {schema = {}} = param
    const value = param.default ?? schema.default ?? schema.enum?.[0] ?? param.example ?? schema.example
    return value === undefined || value === null ? '' : value
}

/**
 * Check that every required parameter has a value
 * @param {Array} params - dereferenced parameters list
 * @param {{}} requestParams - current playground parameter values
 * @return {Boolean}
 */
export function validateParams(params = [], requestParams = {}) {
    return params.every(param => !param.required || !isEmpty(requestParams[param.name]))
}

function isEmpty(value) {
    if (value === undefined || value === null)
        return true
    if (Array.isArray(value))
        return !value.length || value.every(isEmpty)
    return value.toString().trim() === ''
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
