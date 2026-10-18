import React from 'react'
import ApiDocsText from '../api-docs-text'
import describeType, {describeConstraints} from '../api-type-description'
import {isEstimateParam} from '../request/api-call-cost-view'

const locations = [
    {key: 'path', title: 'Path'},
    {key: 'query', title: 'Query'},
    {key: 'header', title: 'Header'}
]

export default function ApiParametersView({parameters}) {
    //"estimate" is a billing switch, not an operation argument - the playground quotes the call cost on its own
    const documented = (parameters || []).filter(p => !isEstimateParam(p))
    if (!documented.length)
        return null
    return <section className="api-section">
        <h2 className="api-section-title">Parameters</h2>
        {locations.map(({key, title}) => {
            const params = documented.filter(p => p.in === key)
            if (!params.length)
                return null
            return <div key={key} className="api-param-group">
                <div className="api-caption">{title}</div>
                {params.map(param => <ParameterView key={param.name} param={param}/>)}
            </div>
        })}
    </section>
}

function ParameterView({param}) {
    const schema = param.schema || {}
    const constraints = describeConstraints(schema)
    const defaultValue = param.default ?? schema.default
    const enumValues = schema.enum || schema.items?.enum
    const example = param.example ?? schema.example
    return <div className="api-param">
        <div className="api-param-header">
            <span className="api-field-name">{param.name}</span>
            <span className="api-type">{describeType(schema)}{!!constraints && <span className="dimmed"> · {constraints}</span>}</span>
            {!!param.required && <span className="api-required">required</span>}
            {defaultValue !== undefined && <span className="api-param-default">
                <span className="dimmed">Default</span> <code>{formatValue(defaultValue)}</code>
            </span>}
        </div>
        <div className="api-docs-text api-field-description">
            <ApiDocsText text={param.description || schema.description}/>
        </div>
        {!!enumValues && <div className="api-enum">
            {enumValues.map(value => <code key={value}>{formatValue(value)}</code>)}
        </div>}
        {!enumValues && example !== undefined && <div className="api-param-example text-small dimmed">
            Example: <code>{formatValue(example)}</code>
        </div>}
    </div>
}

function formatValue(value) {
    if (Array.isArray(value))
        return value.join(', ')
    if (value !== null && typeof value === 'object')
        return JSON.stringify(value)
    return String(value)
}
