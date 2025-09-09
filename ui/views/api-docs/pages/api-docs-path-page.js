import React from 'react'
import {useParams} from 'react-router'
import NotFoundView from '../../pages/not-found-page-view'
import ApiDocsView, {apiPathList} from '../api-docs-view'
import ApiDocsPathView from '../api-docs-path-view'

export default function ApiDocsPathPage() {
    const {tag, method, id} = useParams()
    const apiPath = apiPathList[tag]?.find(path => path.data[method].operationId === id)
    if (!apiPath)
        return <NotFoundView/>

    return <ApiDocsView>
        <ApiDocsPathView tag={tag} path={apiPath.path} methods={apiPath.data}/>
    </ApiDocsView>
}