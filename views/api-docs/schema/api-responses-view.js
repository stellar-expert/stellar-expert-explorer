import React from 'react'
import cn from 'classnames'
import ApiResponseSchemaView from '../request/api-response-schema-view'

export default function ApiResponsesView({responses = {}}) {
    return <div className="space word-break">
        <h3 className="dimmed text-small">RESPONSE FORMAT</h3>
        {Object.entries(responses).map(([code, schema]) => <div key={code} className="space">
            <div>
                <span className={cn(`text-large badge text-monospace`, {
                    'success': +code === 200,
                    'error': +code >= 400,
                })} style={{textTransform: 'uppercase'}}>{code}</span>&nbsp;
                <span className="dimmed">{schema.description}</span>
            </div>
            {Object.entries(schema.content || {}).map(([type, data]) => <div key={type} className="space">
                <h3 className="dimmed text-small">Schema: <span className="text-tiny text-monospace">{type}</span></h3>
                <hr/>
                <ApiResponseSchemaView schema={data.schema}/>
            </div>)}
        </div>)}
    </div>
}