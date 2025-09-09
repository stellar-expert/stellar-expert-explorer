export default function parseComponentReferences(schema, refs) {
    const {schemas, parameters} = schema.components
    for (const [key, value] of Object.entries(refs || {})) {
        if (value.type === 'object' && value.properties) {
            parseComponentReferences(schema, value.properties)
        }
        if (parameters[key]?.schema['$ref']) {
            const name = parameters[key].schema['$ref'].split('/').at(-1)
            swapReference(schemas[name], refs[key], 'schema')
            refs[key].schema['ref'] = name
        }
        if (value['$ref']) {
            const name = value['$ref'].split('/').at(-1)
            parseComponentReferences(schema, schemas[name])
            swapReference(schemas[name], refs, key)
            refs[key]['ref'] = name
        }
        //Handel "oneOf" in schema
        const schemaOneOf = parameters[key]?.schema['oneOf'] || value['oneOf']
        if (schemaOneOf) {
            for (const item of schemaOneOf) {
                const name = item['$ref']?.split('/').at(-1)
                if (item['$ref']) {
                    swapReference(schemas[name], item)
                    item['ref'] = name
                }
            }
        }
        //Handel "allOf" in schema
        const schemaAllOf = parameters[key]?.schema['allOf'] || value['allOf']
        parseAllOf(schemas, schemaAllOf, key, value)
    }
    return refs
}

export function swapReference(comp, obj, key) {
    if (!key) {
        // delete obj['$ref']
        return Object.assign(obj, comp)
    }
    obj[key] = {
        ...comp,
        ...obj[key]
    }
    // delete obj[key]['$ref']
    return obj
}

function parseAllOf(schemas, schemaAllOf, key, value) {
    if (!schemaAllOf)
        return
    const parsedProps = schemaAllOf?.reduce(((prev, current) => {
        if (current['$ref']) {
            const name = current['$ref']?.split('/').at(-1)
            swapReference(schemas[name], current)
        }
        return Object.assign(prev, current.properties || {})
    }), {})
    Object.assign(value,{type: 'object', properties: parsedProps})
}