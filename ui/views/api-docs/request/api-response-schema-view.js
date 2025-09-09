import React, {useState, useCallback, useEffect} from 'react'
import {swapReference} from '../parsers/parse-component-references'
import {componentReferences} from '../api-docs-view'
import ApiSchemaPropertyView, {PropTypeView} from '../schema/api-schema-property-view'
import parsePropertyType from '../parsers/parse-property-type'
import cn from 'classnames'

export default function ApiResponseSchemaView({schema}) {
    if (!schema)
        return null
    return <div className="response-schema">
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

function ResponseComponentView({schema, level = 0, isExpendedAll = false}) {
    const parsedSchema = parseReference(schema)
    switch (parsedSchema?.type) {
        case 'array': return <ResponseArrayView schema={parsedSchema} level={level} isExpendedAll={isExpendedAll}/>
        case 'object': return <div className={cn({'response-object-group': parsedSchema.properties})}>
            {Object.entries(parsedSchema.properties || {}).map(([name, obj]) =>
                <ResponseObjectView key={name} schema={{...obj, required: parsedSchema.required || [], name: name}}
                                    single={Object.keys(parsedSchema.properties || {}).length <= 1}
                                    level={level} isExpendedAll={isExpendedAll}/>)}
        </div>
        default: return level ? null : <ResponsePropertyView schema={schema} compact/>
    }
}

function ResponseObjectView({schema, level = 0, isExpendedAll = false, single}) {
    const [isCollapsed, setIsCollapsed] = useState(!!level)
    const [isToggle, setIsToggle] = useState(isExpendedAll)

    useEffect(() => {
        setIsToggle(isExpendedAll)
        setIsCollapsed(!!level ? !isExpendedAll : !!level)
    }, [isExpendedAll, level])

    const onCollapse = useCallback(() => {
        setIsCollapsed(prev => {
            setIsToggle(!prev)
            return !prev
        })
    }, [isExpendedAll])

    const onToggleAll = useCallback(() => {
        setIsCollapsed(!isCollapsed)
        setIsToggle(true)
    }, [isExpendedAll, isCollapsed])

    return <div className="response-object">
        <ResponsePropertyView schema={schema} single={single} isCollapsed={isCollapsed} onCollapse={onCollapse} onToggleAll={onToggleAll}/>
        {!isCollapsed && <ResponseComponentView schema={schema} isExpendedAll={isToggle} level={level + 1}/>}
    </div>
}

function ResponsePropertyView({schema, isCollapsed, onCollapse, onToggleAll, single, compact = false}) {
    if (!schema)
        return null
    const prop = parsePropertyType(schema)
    const required = Array.isArray(schema.required) ? schema.required.includes(schema.name) : !!schema.required
    const isCollapsible = (schema.type === 'object' && schema.properties) || schema?.items?.type === 'object'
    return <div className="row">
        <div className="column column-25">
            <div className={cn('property-name', {single, compact})}>
                {required && <span className="color-danger">*&nbsp;</span>}
                <span className="text-monospace">{schema.name || 'Response type'}</span>
                {isCollapsible && <>&nbsp;<span onClick={onCollapse} className="collapse">{isCollapsed ? '+' : '-'}</span></>}
                <PropTypeView prop={prop} isCollapsible={isCollapsible} isCollapsed={isCollapsed} onToggleAll={onToggleAll}/>
            </div>
        </div>
        <div className="column column-75">
            {!compact ? <ApiSchemaPropertyView prop={prop} compact onToggleAll={onToggleAll}
                                               isCollapsible={isCollapsible} isCollapsed={isCollapsed} /> :
                <div className="text-small dimmed">{schema.format ? <span>{schema.type} ({schema.format})</span> : schema.type}</div>}
        </div>
    </div>
}

function ResponseArrayView({schema, level = 0, isExpendedAll}) {
    const parsedSchema = parsePropertyType(schema)
    if (!['array', 'object'].includes(parsedSchema.items?.type) && level !== 0)
        return null

    if (parsedSchema.items?.type === 'array')
        return <div>
            <div className="dimmed text-tiny">Array of arrays [</div>
            <div className="response-array">
                <ResponsePropertyView schema={{
                    name: parsedSchema.items?.name ? parsedSchema.items.name : 'Items type',
                    type: parsedSchema.items?.items.typeDescription || parsedSchema.items?.items.type
                }} compact/>
            </div>
            <div className="dimmed text-tiny">]</div>
        </div>

    return <div className="response-array">
        <div className="dimmed text-tiny">Array [</div>
        <div className="response-array">
            <ResponseComponentView schema={parsedSchema.items} level={level} isExpendedAll={isExpendedAll}/>
        </div>
        <div className="dimmed text-tiny">]</div>
    </div>
}

function parseReference(schema = {}) {
    const name = schema['$ref']?.split('/').at(-1)
    return swapReference(componentReferences[name], schema)
}