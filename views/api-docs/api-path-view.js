import React from 'react'
import ApiParametersView from './schema/api-parameters-view'
import ApiDocsText from './api-docs-text'
import ApiResponsesView from './schema/api-responses-view'
import ApiRequestView from './request/api-request-view'
import ApiEndpointView from './api-endpoint-view'
import ApiBreadcrumbsView from './api-breadcrumbs-view'
import {describeOperationTraits, operationLink} from './api-docs-catalog'

/**
 * Operation reference page body: documentation on the left, the playground and examples on the right
 * @param {ApiSpec} spec - documentation section
 * @param {ApiOperation} operation - documented operation
 * @param {{prev: {}, next: {}}} adjacent - neighbour operations in the navigation order
 */
export default function ApiPathView({spec, operation, adjacent}) {
    return <div className="api-operation">
        <article className="segment api-operation-content">
            <ApiBreadcrumbsView spec={spec}/>
            <h1 className="api-page-title">{operation.summary}</h1>
            <ApiEndpointView method={operation.method} path={operation.path}/>
            <div className="api-traits">
                {describeOperationTraits(operation).map(({title, hint}) =>
                    <span key={title} className="api-trait text-tiny" title={hint}>{title}</span>)}
            </div>
            <div className="api-docs-text api-operation-description">
                <ApiDocsText text={operation.description}/>
            </div>
            <ApiParametersView parameters={operation.parameters}/>
            <ApiResponsesView responses={operation.responses}/>
            <AdjacentOperationsView {...adjacent}/>
        </article>
        <div className="api-operation-side">
            <ApiRequestView operation={operation}/>
        </div>
    </div>
}

function AdjacentOperationsView({prev, next}) {
    if (!prev && !next)
        return null
    return <nav className="api-adjacent condensed desktop-only">
        {prev ? <AdjacentLinkView entry={prev} caption={<i className="icon-angle-double-left"/>}/> : <span/>}
        {next ? <AdjacentLinkView entry={next} caption={<i className="icon-angle-double-right"/>} right/> : <span/>}
    </nav>
}

function AdjacentLinkView({entry, caption, right}) {
    const {spec, operation} = entry
    return <a href={operationLink(spec, operation)} className={'api-adjacent-link' + (right ? ' text-right' : '')}>
        {right ? <span className="api-caption">{spec.label} {caption}</span> :
            <span className="api-caption">{caption} {spec.label}</span>}
        <span className="api-adjacent-title">{operation.summary}</span>
    </a>
}
