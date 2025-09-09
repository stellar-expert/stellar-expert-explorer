import React from 'react'
import cn from 'classnames'
import {Accordion} from '@stellar-expert/ui-framework'
import ApiResponseSchemaView from '../request/api-response-schema-view'

export default function ApiResponsesView({responses = {}}) {
    const responseEntries = Object.entries(responses).map(([code, schema]) => {
        return {
            key: code,
            title: <div className="space">
                <span className={cn(`text-large badge`, {
                    'success': +code === 200,
                    'error': +code >= 400,
                })} style={{textTransform: 'uppercase'}}>{code}</span>&nbsp;
                <span className="dimmed">{schema.description}</span>
            </div>,
            content: (+code === 200) ?
                <SuccessResponseView content={schema.content}/> :
                <FailedResponseView content={schema.content}/>
        }
    })

    return <div className="double-space">
        <h3>Responses</h3>
        <Accordion options={responseEntries} collapsedSymbol="+" expandedSymbol="-"/>
    </div>
}

function SuccessResponseView({content = {}}) {
    if (!content)
        return null

    return Object.entries(content).map(([type, data]) => <div key={type} className="space">
        <div className="dimmed text-tiny">Response schema: {type}</div>
        <hr/>
        <ApiResponseSchemaView schema={data.schema}/>
    </div>)
}

function FailedResponseView({content = {}}) {
    const example = content?.['application/json']?.example
    if (!example)
        return null

    return <div className="space">
        <h4 className="dimmed text-small">RESPONSE ERROR: </h4>
        <hr/>
        {example?.map(res => {
            if (!res.error)
                return null
            return <div key={res.error} className="segment space error">{res.error}</div>
        })}
    </div>
}