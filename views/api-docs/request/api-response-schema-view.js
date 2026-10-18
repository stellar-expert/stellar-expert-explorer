import React, {useCallback, useState} from 'react'
import cn from 'classnames'
import ApiDocsText from '../api-docs-text'
import describeType from '../api-type-description'

const maxNestingLevel = 12
//nested objects with more fields than this start collapsed
const collapseThreshold = 5

/**
 * @typedef {{}} SchemaField
 * @property {String} name - property name, or a variant title for oneOf/anyOf branches
 * @property {{}} schema - dereferenced property schema
 * @property {Boolean} required - whether the parent object declares the property as required
 * @property {String} [variant] - "one of"/"any of" for schema variant branches
 */

export default function ApiResponseSchemaView({schema}) {
    if (!schema)
        return null
    const fields = listChildren(schema)
    const rootType = schema.type === 'array' || !fields.length ? describeType(schema) : null
    return <div className="api-schema">
        {!!rootType && <div className="api-schema-root"><span className="api-type">{rootType}</span></div>}
        {fields.map(field => <SchemaFieldView key={field.name} field={field} depth={0}/>)}
    </div>
}

function SchemaFieldView({field, depth}) {
    const {name, schema, required, variant, description} = flattenSingleChild(field)
    const children = depth < maxNestingLevel ? listChildren(schema) : []
    const collapsible = depth > 0 && children.length > collapseThreshold
    const [expanded, setExpanded] = useState(!collapsible)
    const toggle = useCallback(() => setExpanded(prev => !prev), [])
    const type = describeType(schema)
    const enumValues = schema.enum || schema.items?.enum

    return <div className="api-field">
        <div className="api-field-header">
            <span className={cn('api-field-name', {dimmed: !!variant})}>{name}</span>
            <span className="api-type">
                {variant ? `${variant}${type ? ' ' + type : ''}` : type}{!!schema.recursive && ' (recursive)'}
            </span>
            {!!required && <span className="api-required">required</span>}
            {collapsible && <a href="#" className="api-field-toggle" onClick={toggle}>
                {expanded ? 'Hide fields' : `Show ${children.length} fields`}
            </a>}
        </div>
        {!!description && <div className="api-docs-text api-field-description"><ApiDocsText text={description}/></div>}
        {!!enumValues && <div className="api-enum">
            {enumValues.map(value => <code key={value}>{String(value)}</code>)}
        </div>}
        {expanded && children.length > 0 && <div className="api-field-children">
            {children.map(child => <SchemaFieldView key={child.name} field={child} depth={depth + 1}/>)}
        </div>}
    </div>
}

/**
 * Merge an object holding a single property into a dotted path, e.g. "_embedded.records"
 * @param {SchemaField} field
 * @return {SchemaField}
 */
function flattenSingleChild(field) {
    let current = {...field, description: field.schema?.description}
    while (!current.variant && current.schema?.type === 'object' && !current.schema.recursive) {
        const children = listChildren(current.schema)
        if (children.length !== 1 || children[0].variant)
            break
        const [child] = children
        current = {
            name: current.name + '.' + child.name,
            schema: child.schema,
            required: current.required,
            description: child.schema?.description || current.description
        }
    }
    return current
}

/**
 * List properties shown as children of a schema node
 * @param {{}} schema - dereferenced schema
 * @return {SchemaField[]}
 */
function listChildren(schema) {
    if (!schema || typeof schema !== 'object' || schema.recursive)
        return []
    if (schema.type === 'array')
        return listChildren(schema.items)
    if (schema.allOf)
        return mergeProperties(schema.allOf)
    const variants = schema.oneOf || schema.anyOf
    if (variants) {
        //variants of plain values are fully described by the type line, e.g. "string | integer"
        if (!variants.some(item => listChildren(item).length))
            return []
        const variant = schema.oneOf ? 'one of' : 'any of'
        return variants.map((item, i) => ({name: item.ref || item.title || `variant ${i + 1}`, schema: item, required: false, variant}))
    }
    const required = schema.required || []
    return Object.entries(schema.properties || {})
        .map(([name, value]) => ({name, schema: value, required: Array.isArray(required) && required.includes(name)}))
}

function mergeProperties(parts) {
    const merged = new Map()
    for (const part of parts) {
        for (const child of listChildren(part)) {
            merged.set(child.name, child)
        }
    }
    return Array.from(merged.values())
}
