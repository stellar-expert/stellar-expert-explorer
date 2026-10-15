import React from 'react'
import cn from 'classnames'
import ApiSchemaPropertyView from '../schema/api-schema-property-view'
import describeType from '../api-type-description'

const maxNestingLevel = 12

/**
 * @typedef {{}} SchemaTreeNode
 * @property {String} key - unique node key
 * @property {String} name - property name, or a variant title for oneOf/anyOf branches
 * @property {{}} schema - dereferenced property schema
 * @property {Boolean} required - whether the parent object declares the property as required
 * @property {String} [variant] - "one of"/"any of" for schema variant branches
 * @property {Number} depth - nesting level, 0 for top-level properties
 * @property {Boolean} last - whether this is the last child of its parent
 * @property {Boolean[]} guides - for every ancestor level, whether the ancestor branch continues below this node
 * @property {Boolean} hasChildren - whether the node is followed by its own children
 */

export default function ApiResponseSchemaView({schema}) {
    if (!schema)
        return null
    const nodes = []
    collectNodes(schema, 0, [], '', nodes)
    const rootType = schema.type === 'array' || !nodes.length ? describeType(schema) : null
    return <div className="schema-tree">
        {!!rootType && <div className="schema-tree-root dimmed text-small text-monospace condensed">{rootType}</div>}
        {nodes.map(node => <SchemaTreeNodeView key={node.key} node={node}/>)}
    </div>
}

function SchemaTreeNodeView({node}) {
    const {name, schema, required, variant, depth, last, guides, hasChildren} = node
    const prop = {...schema, name, typeDescription: describeNodeType(node)}
    return <div className="schema-tree-node">
        <div className="schema-tree-name text-monospace condensed">
            {guides.map((continues, i) => <span key={i} className={cn('schema-tree-guide', {continues})}/>)}
            {depth > 0 && <span className={cn('schema-tree-branch', {last})}/>}
            <div className="schema-tree-label">
                <div className={cn('schema-tree-label-text', {dimmed: !!variant})}>
                    <div>{name}</div>
                    {!!required && <div className="text-tiny color-danger">required</div>}
                </div>
                {/*fills the rest of the row, drawing the line down to the first child when there is one*/}
                <div className={cn('schema-tree-stem', {active: hasChildren})}/>
            </div>
        </div>
        <div className="schema-tree-type">
            <ApiSchemaPropertyView prop={prop} compact/>
        </div>
    </div>
}

function describeNodeType({schema, variant}) {
    const type = describeType(schema)
    if (schema.recursive)
        return type + ' (recursive)'
    if (variant)
        return type ? `${variant}: ${type}` : variant
    return type
}

/**
 * Flatten the schema into the list of tree rows in the display order
 * @param {{}} schema - dereferenced schema
 * @param {Number} depth - nesting level of the children
 * @param {Boolean[]} guides - ancestor guide lines inherited by the children
 * @param {String} keyPrefix - key path of the parent node
 * @param {SchemaTreeNode[]} nodes - accumulator
 */
function collectNodes(schema, depth, guides, keyPrefix, nodes) {
    if (depth > maxNestingLevel)
        return
    const children = listChildren(schema)
    children.forEach((child, i) => {
        const last = i === children.length - 1
        const node = {
            ...child,
            key: keyPrefix + '/' + child.name,
            depth,
            last,
            guides,
            hasChildren: false
        }
        nodes.push(node)
        const before = nodes.length
        //a branch continues past the nested rows of the node only if the node has siblings below
        collectNodes(child.schema, depth + 1, depth > 0 ? [...guides, !last] : guides, node.key, nodes)
        node.hasChildren = nodes.length > before
    })
}

/**
 * List properties shown as children of a schema node
 * @param {{}} schema - dereferenced schema
 * @return {Array<{name: String, schema: {}, required: Boolean, variant: String}>}
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
