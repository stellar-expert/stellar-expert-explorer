import React from 'react'
import ApiResponseSchemaView from '../request/api-response-schema-view'
import ApiStatusBadge from '../api-status-badge'

export default function ApiResponsesView({responses = {}}) {
    const entries = Object.entries(responses)
    if (!entries.length)
        return null
    return <section className="api-section">
        <h2 className="api-section-title">Response</h2>
        {entries.map(([code, response]) => {
            const content = Object.entries(response.content || {})
            if (!content.length)
                return <ResponseHeaderView key={code} code={code} description={response.description}/>
            return content.map(([mediaType, data]) => <div key={code + mediaType} className="api-response">
                <ResponseHeaderView code={code} description={response.description} mediaType={mediaType}/>
                <ApiResponseSchemaView schema={data.schema}/>
            </div>)
        })}
    </section>
}

function ResponseHeaderView({code, description, mediaType}) {
    return <div className="api-response-header">
        <ApiStatusBadge code={code}/>
        <span className="api-response-title">{description}</span>
        {!!mediaType && <span className="api-response-media dimmed">{mediaType}</span>}
    </div>
}
