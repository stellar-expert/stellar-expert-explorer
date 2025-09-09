import React from 'react'
import {componentReferences} from '../api-docs-view'
import {swapReference} from '../parsers/parse-component-references'
import parsePropertyType from '../parsers/parse-property-type'
import ApiSchemaPropertyView from './api-schema-property-view'

export default function ApiParametersView({parameters}) {
    if (!parameters)
        return null
    const params = parameters.map(p => swapReference(componentReferences[p.originalName || p.name], p))
    const inPath = params.filter(p => p.in === 'path')
    const inQuery = params.filter(p => p.in === 'query')
    return <div>
        {!!inPath.length && <div className="double-space">
            <h4 className="dimmed text-small">PATH PARAMETERS</h4>
            <hr/>
            {inPath.map(param => <PropertyEntryView key={param.name} param={param}/>)}
        </div>}
        {!!inQuery.length && <div className="double-space">
            <h4 className="dimmed text-small">QUERY PARAMETERS</h4>
            <hr/>
            {inQuery.map(param => <PropertyEntryView key={param.name} param={param}/>)}
        </div>}
    </div>
}

function PropertyEntryView({param}) {
    const {schema, ...otherParameters} = param
    const prop = {...parsePropertyType(schema), ...otherParameters}
    return <div className="row space">
        <div className="column column-33">
            <code className="text-monospace">{prop.name}</code>
            {prop.required && <span className="color-danger" title="Value required"> *</span>}
        </div>
        <div className="column column-66">
            <ApiSchemaPropertyView prop={prop}/>
        </div>
    </div>
}