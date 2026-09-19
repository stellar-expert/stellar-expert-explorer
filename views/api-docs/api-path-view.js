import React from 'react'
import ApiParametersView from './schema/api-parameters-view'
import ApiDocsText from './api-docs-text'
import ApiResponsesView from './schema/api-responses-view'
import ApiRequestView from './request/api-request-view'

export default function ApiPathView({operation}) {
    return <div className="row">
        <div className="column column-60">
            <div className="segment">
                <h3>{operation.summary}</h3>
                <hr className="flare"/>
                <div className="space text-justify"><ApiDocsText text={operation.description}/></div>
                <ApiParametersView parameters={operation.parameters}/>
                <hr className="space"/>
                <ApiResponsesView responses={operation.responses}/>
            </div>
        </div>
        <div className="column column-40">
            <ApiRequestView operation={operation}/>
        </div>
        <div className="column double-space"/>
    </div>
}
