import React from 'react'
import ApiPlaygroundView from './api-playground-view'
import ApiResponseExamplesView from './api-response-examples-view'

/**
 * Right-hand column of an operation page: the request playground and documented response examples
 * @param {ApiOperation} operation
 */
export default function ApiRequestView({operation}) {
    //keyed by the operation, so the playground arguments and the selected example reset on navigation
    return <>
        <ApiPlaygroundView key={operation.operationId} operation={operation}/>
        <ApiResponseExamplesView key={'examples-' + operation.operationId} responses={operation.responses}/>
    </>
}
