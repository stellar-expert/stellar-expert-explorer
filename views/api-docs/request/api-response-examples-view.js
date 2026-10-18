import React, {useCallback, useMemo, useState} from 'react'
import cn from 'classnames'
import {CodeBlock} from '@stellar-expert/ui-framework'
import {statusKind} from '../api-status-badge'

//long arrays in examples are cut down to a few items until the full example is requested
const maxArrayItems = 3
const shownArrayItems = 2
//arrays of plain values shorter than this stay on a single line
const inlineArrayLength = 60

/**
 * @typedef {{}} ResponseExamples
 * @property {String} code - HTTP status code
 * @property {String} mediaType - response content type
 * @property {{name: String, value: *}[]} examples - documented examples
 */

/**
 * Documented response examples, one tab per response status
 * @param {{}} responses - dereferenced responses map of the operation
 */
export default function ApiResponseExamplesView({responses = {}}) {
    const groups = useMemo(() => collectExamples(responses), [responses])
    const [selected, setSelected] = useState(groups[0]?.code)
    if (!groups.length)
        return null
    const current = groups.find(g => g.code === selected) || groups[0]
    //client errors are secondary to the successful response, so only their titles are shown until expanded
    const foldable = statusKind(current.code) === 'warning'

    return <div className="segment api-panel api-examples">
        <div className="api-panel-header">
            <h3>Example response</h3>
            <div className="api-example-tabs">
                {groups.map(({code}) => <a key={code} href="#" onClick={() => setSelected(code)}
                                           className={cn('api-example-tab', statusKind(code), {selected: code === current.code})}>
                    {code}
                </a>)}
            </div>
        </div>
        <div className="api-caption">Documented example · {current.mediaType}</div>
        {current.examples.map(({name, value}) => foldable ?
            <details key={name} className="api-example-foldable">
                <summary>{name || current.code}<i className="icon icon-angle-down"/></summary>
                <ExampleCodeView value={value}/>
            </details> :
            <div key={name} className="api-example">
                {!!name && <div className="api-example-name text-small dimmed">{name}</div>}
                <ExampleCodeView value={value}/>
            </div>)}
    </div>
}

function ExampleCodeView({value}) {
    const [full, setFull] = useState(false)
    const showFull = useCallback(() => setFull(true), [])
    const formatted = formatExample(value, !full)
    return <>
        <CodeBlock lang="json">{formatted.text}</CodeBlock>
        {formatted.truncated && <a href="#" className="api-example-more text-small" onClick={showFull}>Show full example</a>}
    </>
}

/**
 * @param {{}} responses - dereferenced responses map
 * @return {ResponseExamples[]}
 */
function collectExamples(responses) {
    const groups = []
    for (const [code, response] of Object.entries(responses)) {
        for (const [mediaType, data] of Object.entries(response.content || {})) {
            const examples = listExamples(data)
            if (examples.length) {
                groups.push({code, mediaType, examples})
                break //one media type per status is enough for a quick look
            }
        }
    }
    return groups
}

/**
 * Retrieve response examples from either a single "example" or a named "examples" map
 * @param {{}} data - media type descriptor
 * @return {{name: String, value: *}[]}
 */
function listExamples(data = {}) {
    if (data.examples)
        return Object.entries(data.examples).map(([name, example]) => ({name, value: example?.value ?? example}))
    const example = data.example ?? data.schema?.example
    return example === undefined ? [] : [{name: '', value: example}]
}

/**
 * Pretty-print an example, optionally cutting long arrays down
 * @param {*} value - example value
 * @param {Boolean} truncate - whether to cut long arrays
 * @return {{text: String, truncated: Boolean}}
 */
function formatExample(value, truncate) {
    if (typeof value !== 'object' || value === null)
        return {text: (value ?? '').toString(), truncated: false}
    let truncated = false

    function format(node, depth) {
        if (node === null || typeof node !== 'object')
            return JSON.stringify(node)
        const pad = '  '.repeat(depth + 1)
        const closingPad = '  '.repeat(depth)
        if (Array.isArray(node)) {
            if (!node.length)
                return '[]'
            if (node.every(item => item === null || typeof item !== 'object')) {
                const inline = JSON.stringify(node).replace(/,/g, ', ')
                if (inline.length <= inlineArrayLength)
                    return inline
            }
            let items = node
            const lines = []
            if (truncate && node.length > maxArrayItems) {
                items = node.slice(0, shownArrayItems)
                truncated = true
            }
            for (const item of items) {
                lines.push(pad + format(item, depth + 1))
            }
            if (items.length < node.length) {
                lines.push(pad + `… ${node.length - items.length} more`)
            }
            return '[\n' + lines.join(',\n') + '\n' + closingPad + ']'
        }
        const entries = Object.entries(node)
        if (!entries.length)
            return '{}'
        return '{\n' + entries.map(([key, item]) => pad + JSON.stringify(key) + ': ' + format(item, depth + 1)).join(',\n') +
            '\n' + closingPad + '}'
    }

    const text = format(value, 0)
    return {text, truncated}
}
