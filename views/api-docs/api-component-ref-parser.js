import openApiData from './openapi/api.json'

const componentSchemas = openApiData.components.schemas
const parameters = openApiData.components.parameters

export default function apiComponentRefParser(data) {
    for (const [key, value] of Object.entries(data || {})) {
        if (value.type === 'object' && value.properties) {
            apiComponentRefParser(value.properties)
        }
        if (parameters[key]?.schema['$ref']) {
            const name = parameters[key].schema['$ref'].split('/').at(-1)
            swapReference(componentSchemas[name], data[key], 'schema')
            data[key].schema['ref'] = name
        }
        if (value['$ref']) {
            const name = value['$ref'].split('/').at(-1)
            apiComponentRefParser(componentSchemas[name])
            swapReference(componentSchemas[name], data, key)
            data[key]['ref'] = name
        }
        //Handel "oneOf" in schema
        const schemaOneOf = parameters[key]?.schema['oneOf'] || value['oneOf']
        schemaOneOf?.forEach(item => {
            const name = item['$ref']?.split('/').at(-1)
            if (item['$ref']) {
                swapReference(componentSchemas[name], item)
                item['ref'] = name
            }
        })
        //Handel "allOf" in schema
        const schemaAllOf = parameters[key]?.schema['allOf'] || value['allOf']
        parseAllOf(schemaAllOf, key, value)
    }
    return data
}

export function swapReference(comp, obj, key) {
    if (!key) {
        delete obj['$ref']
        return Object.assign(obj, comp)
    }
    obj[key] = {
        ...comp,
        ...obj[key]
    }
    delete obj[key]['$ref']
    return obj
}

function parseAllOf(schemaAllOf, key, value) {
    if (!schemaAllOf)
        return
    const parsedProps = schemaAllOf?.reduce(((prev, current) => {
        if (current['$ref']) {
            const name = current['$ref']?.split('/').at(-1)
            swapReference(componentSchemas[name], current)
        }
        return Object.assign(prev, current.properties || {})
    }), {})
    Object.assign(value,{type: 'object', properties: parsedProps})
}