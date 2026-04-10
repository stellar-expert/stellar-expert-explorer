import React from 'react'
import {useParams} from 'react-router'
import NotFoundView from '../../pages/not-found-page-view'
import ApiDocsView, {apiPathList} from '../api-docs-view'
import ApiPathView from '../api-path-view'

export default function ApiDocumentationPathPage() {
    const {tag, method, id} = useParams()
    const apiPath = apiPathList[tag]?.find(path => path.data[method].operationId === id)
    if (!apiPath)
        return <NotFoundView/>

    return <ApiDocsView>
        <h2>{tag}</h2>
        <ApiPathView path={apiPath.path} methods={apiPath.data}/>
    </ApiDocsView>
}