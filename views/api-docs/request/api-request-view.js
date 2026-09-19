import React from 'react'
import cn from 'classnames'
import {CodeBlock} from '@stellar-expert/ui-framework/controls/code-block'
import ApiPlaygroundView from './api-playground-view'

export default function ApiRequestView({operation}) {
    const {path, method, parameters, responses} = operation
    return <div className="response-block">
        <div className="text-monospace condensed">
            <span className={cn('text-large badge', {success: method === 'get'})} style={{textTransform: 'uppercase'}}>
                {method}</span>&thinsp;<span className="dimmed word-break">{path}</span>
        </div>
        <hr/>
        <ApiPlaygroundView path={path} params={parameters}/>
        <h3 className="space">Response examples</h3>
        <div>
            {Object.entries(responses).map(([code, response]) =>
                <ResponseSchemaExamplesView key={code} code={code} content={response.content}/>)}
        </div>
    </div>
}

function ResponseSchemaExamplesView({code, content}) {
    if (!content)
        return null

    return Object.entries(content).map(([mediaType, data]) => {
        const colorClass = 'text-monospace condensed ' + (code === '200' ? 'color-success' : 'color-warning')
        return listExamples(data).map(({name, value}) => <div key={code + mediaType + name}>
            <div className={colorClass}>{code} {mediaType}{name && <span className="dimmed"> – {name}</span>}</div>
            <CodeBlock>{formatExample(value)}</CodeBlock>
            <div className="space"/>
        </div>)
    })
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

function formatExample(example) {
    return typeof example !== 'object' ? (example ?? '').toString() : JSON.stringify(example, null, 2)
}
