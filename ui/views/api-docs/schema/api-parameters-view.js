import React from 'react'
import apiPropertyTypeParser from '../api-property-type-parser'
import ApiSchemaPropertyView from './api-schema-property-view'
import {swapReference} from '../api-component-ref-parser'
import {componentReference} from '../api-docs-view'

export default function ApiParametersView({parameters}) {
    if (!parameters)
        return null
    const params = parameters.map(p => swapReference(componentReference[p.originalName || p.name], p))
    const inPath = params.filter(p => p.in === 'path')
    const inQuery = params.filter(p => p.in === 'query')
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
    const {schema, ...otherParameters} = param
    const prop = {...apiPropertyTypeParser(schema), ...otherParameters}
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