import React from 'react'
import {CodeBlock} from '@stellar-expert/ui-framework/controls/code-block'
import ApiPlaygroundView from './api-playground-view'
import cn from 'classnames'

export default function ApiRequestView({path, data}) {
    return <div className="playground-block">
        <ApiPlaygroundView path={path} data={data}/>
        <div className="double-space"><h3>Response examples:</h3></div>
        <div className="space">
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
        if (!example)
            return null
        const codeExample = typeof example !== 'object' ? example.toString() : JSON.stringify(example, null, 2)
        return <div key={code + type}>
            <div className="space">
                <span className={cn('text-large badge text-monospace', {
                    'success': +code === 200,
                    'error': +code >= 400,
                })}>{code}</span>&nbsp;
                <span className="dimmed text-small">{type}</span>
            </div>
            {+code === 200 ?
                <CodeBlock>{codeExample}</CodeBlock> :
                example?.map(res => <CodeBlock key={res.error}>{JSON.stringify(res, null, 2)}</CodeBlock>)
            }
        </div>
    })
}