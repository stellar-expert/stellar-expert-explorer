import React from 'react'
import cn from 'classnames'
import ApiParametersView from './schema/api-parameters-view'
import ApiResponsesView from './schema/api-responses-view'
import ApiPaginationView from './schema/api-pagination-view'
import ApiRequestView from './request/api-request-view'
import parseDocumentationText from './parsers/parse-documentation-text'

export default function ApiDocsPathView({tag, path, methods}) {
    return <div>
        {Object.entries(methods).map(([method, data]) => <div key={data.operationId} className={cn('row', {space: !tag})}>
            <div className="column column-60">
                <div className="segment blank">
                    <h3>
                        {data.summary}&nbsp;
                        {!!data.cost ? <sup className="badge info text-tiny ">paid</sup> :
                            <sup className="badge success text-tiny ">free</sup>}
                    </h3>
                    <hr className="flare"/>
                    <div className="space">
                        <span className={cn(`text-large badge`, {'success': method === 'get'})} style={{textTransform: 'uppercase'}}>
                            {method}
                        </span>
                        <span className="dimmed word-break">&nbsp;{path}</span>
                    </div>
                    {!!data.cost && <div className="space">
                        Cost per request: {data.cost} <span className="dimmed text-small">credits</span>
                    </div>}
                    <div className="space">{parseDocumentationText(data.description)}</div>
                    <ApiParametersView parameters={data.parameters}/>
                    <div className="space"/>
                    <hr/>
                    <ApiResponsesView responses={data.responses}/>
                    {tag && <ApiPaginationView tag={tag} method={method} id={data.operationId}/>}
                </div>
            </div>
            <div className="column column-40">
                <ApiRequestView path={path} data={data}/>
            </div>
        </div>)}
    </div>
}