import React from 'react'
import {useParams} from 'react-router'
import NotFoundView from '../../pages/not-found-page-view'
import ApiDocsView, {apiPathList} from '../api-docs-view'
import ApiPathView from '../api-path-view'

export default function ApiDocumentationTagPage() {
    const {tag} = useParams()
    if (!apiPathList[tag]?.length)
        return <NotFoundView/>

    return <ApiDocsView>
        <h2>{tag}</h2>
        {apiPathList[tag].map(entry => <ApiPathView key={entry.path} path={entry.path} methods={entry.data}/>)}
    </ApiDocsView>
}