import {componentReferences} from '../api-docs-view'
import {swapReference} from './parse-component-references'

export default function parsePropertyType(param) {
    if (!param)
        return false
    const paramArray = param.anyOf || param.oneOf
    const typeArray = paramArray?.map(item => {
        const name = item['$ref']?.split('/').at(-1) || item.ref
        const schema = swapReference(componentReferences[name], item)
        item.ref = name
        return `${schema.type} ${name ? `(${name})` : ''}`
    })
    const paramType = (param['$ref'] || param['ref']) ? 'reference' : param.type
    switch (paramType) {
        case 'array':
            param['typeDescription'] = parseArrayType(param)
            break
        case 'reference':
            param['typeDescription'] = parseReferenceType(param)
            break
        default:
            param['typeDescription'] = typeArray ? typeArray.join(' or ') : paramType
            break
    }
    return param
}

function parseArrayType(param) {
    if (!param.items)
        return 'array'
    const name = param.items['$ref']?.split('/').at(-1) || param.items.ref
    swapReference(componentReferences[name], param, 'items')
    return `Array of ${param.items.type}s ${name ? `(${name})` : ''}`
}

function parseReferenceType(param) {
    const name = param['$ref']?.split('/').at(-1) || param.ref
    swapReference(componentReferences[name], param)
    return `${param.type} ${name ? `(${name})` : ''}`
}