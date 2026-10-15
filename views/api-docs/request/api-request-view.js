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

    //client errors are secondary to the successful response, so only their titles are shown until expanded
    const foldable = +code >= 400 && +code < 500
    return Object.entries(content).map(([mediaType, data]) => {
        const colorClass = 'text-monospace condensed ' + (code === '200' ? 'color-success' : 'color-warning')
        return listExamples(data).map(({name, value}) => {
            const title = <>{code} {mediaType}{!!name && <span className="dimmed"> – {name}</span>}</>
            const example = <CodeBlock>{formatExample(value)}</CodeBlock>
            if (foldable)
                return <details key={code + mediaType + name} className="response-example-foldable micro-space">
                    <summary className={colorClass}>{title}<i className="icon icon-more"/></summary>
                    {example}
                </details>
            return <div key={code + mediaType + name}>
                <div className={colorClass}>{title}</div>
                {example}
                <div className="space"/>
            </div>
        })
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
