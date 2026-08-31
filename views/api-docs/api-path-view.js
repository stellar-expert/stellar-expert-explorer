import React from 'react'
import ApiParametersView from './schema/api-parameters-view'
import ApiDocsText from './api-docs-text'
import ApiResponsesView from './schema/api-responses-view'
import ApiRequestView from './request/api-request-view'

export default function ApiPathView({path, methods}) {
    return <div>
        {Object.entries(methods).map(([method, data]) => <div key={data.operationId} className="row">
            <div className="column column-60">
                <div className="segment">
                    <h3>{data.summary}</h3>
                    <hr className="flare"/>
                    <div className="space text-justify"><ApiDocsText text={data.description}/></div>
                    <ApiParametersView parameters={data.parameters}/>
                    <hr className="space"/>
                    <ApiResponsesView responses={data.responses}/>
                </div>
            </div>
            <div className="column column-40">
                <ApiRequestView path={path} method={method} data={data}/>
            </div>
            <div className="column double-space"></div>
        </div>)}
    </div>
}