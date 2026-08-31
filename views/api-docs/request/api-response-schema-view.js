import React from 'react'
import {swapReference} from '../api-component-ref-parser'
import {componentReference} from '../api-docs-view'
import ApiSchemaPropertyView from '../schema/api-schema-property-view'
import apiPropertyTypeParser from '../api-property-type-parser'

export default function ApiResponseSchemaView({schema}) {
    if (!schema)
        return null
    return <div>
        {(schema['allOf'] || schema['oneOf']) && <ResponseAllOfComponentsView schema={schema}/>}
        {schema['$ref'] && <ResponseComponentView schema={schema}/>}
        {schema['type'] && <ResponseComponentView schema={schema}/>}
    </div>
}

function ResponseAllOfComponentsView({schema}) {
    const properties = (schema['allOf'] || schema['oneOf']).map(item => {
        const component = item['$ref'] ? parseReference(item) : item
        return component.properties
    })
    const mergedProperties = Object.assign({}, ...properties)
    return <ApiResponseSchemaView schema={{type: 'object', properties: mergedProperties}}/>
}

function ResponseComponentView({schema, level = 0}) {
    const parsedSchema = parseReference(schema)
    switch (parsedSchema?.type) {
        case 'array': return <ResponseArrayView schema={parsedSchema} level={level}/>
        case 'object': return Object.entries(parsedSchema.properties || {}).map(([name, obj]) =>
            <ResponseObjectView key={name} schema={{...obj, required: parsedSchema.required || [], name: name}} level={level}/>)
        default: return level ? null : <ResponsePropertyView schema={schema} compact/>
    }
}

function ResponseObjectView({schema, level = 0}) {
    return <div className="response-object">
        <ResponsePropertyView schema={schema}/>
        <div className="response-object-group">
            <ResponseComponentView schema={schema} level={level + 1}/>
        </div>
    </div>
}

function ResponsePropertyView({schema, compact = false}) {
    if (!schema)
        return null
    const prop = apiPropertyTypeParser(schema)
    const required = Array.isArray(schema.required) ? schema.required.includes(schema.name) : !!schema.required
    return <div className="row">
        <div className="column column-25">
            {!compact && <div className="property-name text-monospace condensed">
                <div>{schema.name}</div>
                {required && <div className="text-tiny color-danger">required</div>}
            </div>}
        </div>
        <div className="column column-75">
            {!compact ? <ApiSchemaPropertyView prop={prop} compact/> :
                <div className="text-small dimmed">{schema.format ? <span>{schema.type} ({schema.format})</span> : schema.type}</div>}
        </div>
    </div>
}

function ResponseArrayView({schema, level = 0}) {
    const parsedSchema = apiPropertyTypeParser(schema)
    if (!['array', 'object'].includes(parsedSchema.items?.type) && level !== 0)
        return null

    return <div className="micro-space">
        Array [
        <div className="response-object">
            {parsedSchema.items?.type === 'array' ?
                <div>
                    Array [
                    <div className="row">
                        <div className="column column-75 column-offset-25">
                            <div className="dimmed">{parsedSchema.items?.items.typeDescription || parsedSchema.items?.items.type}</div>
                        </div>
                    </div>
                    ]
                </div> :
                <ResponseComponentView schema={parsedSchema.items} level={level}/>}
        </div>
        ]
    </div>
}

function parseReference(schema = {}) {
    const name = schema['$ref']?.split('/').at(-1)
    return swapReference(componentReference[name], schema)
}