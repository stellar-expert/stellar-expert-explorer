import React from 'react'
import {CodeBlock} from '@stellar-expert/ui-framework/controls/code-block'
import ApiPlaygroundView from './api-playground-view'
import cn from 'classnames'

export default function ApiRequestView({path, method, data}) {
    return <div className="response-block">
        <div className="text-monospace condensed">
            <span className={cn(`text-large badge`, {success: method === 'get'})} style={{textTransform: 'uppercase'}}>
                {method}</span>&thinsp;<span className="dimmed word-break">{path}</span>
        </div>
        <hr/>
        <ApiPlaygroundView path={path} data={data}/>
        <h3 className="space">Response examples</h3>
        <div>
            {Object.entries(data.responses).map(([code, response]) =>
                <ResponseSchemaExamplesView key={code} code={code} response={response.content}/>)}
        </div>
    </div>
}

function ResponseSchemaExamplesView({code, response}) {
    if (!response)
        return null

    return Object.entries(response || {}).map(([type, data]) => {
        const example = data?.example || data?.schema?.example || ''
        const codeExample = typeof example !== 'object' ? example.toString() : JSON.stringify(example, null, 2)
        const colorClass = 'text-monospace condensed ' + (code === '200' ? 'color-success' : 'color-warning')
        return <div key={code + type}>
            <div className={colorClass}>{code} {type}</div>
            <CodeBlock>{codeExample}</CodeBlock>
            <div className="space"/>
        </div>
    })
}