import React from 'react'
import describeType from '../api-type-description'
import ApiSchemaPropertyView from './api-schema-property-view'

export default function ApiParametersView({parameters}) {
    if (!parameters?.length)
        return null
    const inPath = parameters.filter(p => p.in === 'path')
    const inQuery = parameters.filter(p => p.in === 'query')
    return <div>
        {!!inPath.length && <div className="space word-break">
            <h3 className="dimmed text-small">PATH PARAMETERS</h3>
            <hr/>
            {inPath.map(param => <PropertyEntryView key={param.name} param={param}/>)}
        </div>}
        {!!inQuery.length && <div className="space word-break">
            <h3 className="dimmed text-small">QUERY PARAMETERS</h3>
            <hr/>
            {inQuery.map(param => <PropertyEntryView key={param.name} param={param}/>)}
        </div>}
    </div>
}

function PropertyEntryView({param}) {
    const {schema = {}, ...otherParameters} = param
    const prop = {...schema, ...otherParameters, typeDescription: describeType(schema)}
    return <div className="row space">
        <div className="column column-25 text-monospace condensed">
            <div>{prop.name}</div>
            {prop.required && <div className="text-tiny color-danger">required</div>}
        </div>
        <div className="column column-75">
            <ApiSchemaPropertyView prop={prop}/>
        </div>
    </div>
}
