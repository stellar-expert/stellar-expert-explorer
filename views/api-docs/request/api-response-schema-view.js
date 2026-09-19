import React from 'react'
import ApiSchemaPropertyView from '../schema/api-schema-property-view'
import describeType from '../api-type-description'

const maxNestingLevel = 12

export default function ApiResponseSchemaView({schema}) {
    if (!schema)
        return null
    if (schema.allOf || schema.oneOf)
        return <ResponseAllOfComponentsView schema={schema}/>
    if (schema.type)
        return <ResponseComponentView schema={schema}/>
    return null
}

function ResponseAllOfComponentsView({schema}) {
    const mergedProperties = Object.assign({}, ...(schema.allOf || schema.oneOf).map(item => item.properties))
    return <ApiResponseSchemaView schema={{type: 'object', properties: mergedProperties}}/>
}

function ResponseComponentView({schema, level = 0}) {
    if (!schema || level > maxNestingLevel)
        return null
    if (schema.recursive)
        return <div className="dimmed text-small text-monospace condensed">{schema.ref} (recursive)</div>
    switch (schema.type) {
        case 'array':
            return <ResponseArrayView schema={schema} level={level}/>
        case 'object':
            return Object.entries(schema.properties || {}).map(([name, obj]) =>
                <ResponseObjectView key={name} schema={{...obj, required: schema.required || [], name}} level={level}/>)
        default:
            return level ? null : <ResponsePropertyView schema={schema} compact/>
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
    const prop = {...schema, typeDescription: describeType(schema)}
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
    const items = schema.items
    if (!['array', 'object'].includes(items?.type) && level !== 0)
        return null

    return <div className="micro-space">
        Array [
        <div className="response-object">
            {items?.type === 'array' ?
                <div>
                    Array [
                    <div className="row">
                        <div className="column column-75 column-offset-25">
                            <div className="dimmed">{describeType(items.items) || items.items?.type}</div>
                        </div>
                    </div>
                    ]
                </div> :
                <ResponseComponentView schema={items} level={level}/>}
        </div>
        ]
    </div>
}
