import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import NotFoundView from '../../pages/not-found-page-view'
import ErrorNotificationBlock from '../../components/error-notification-block'
import ApiDocsView from '../api-docs-view'
import ApiPathView from '../api-path-view'
import {useApiSpec} from '../api-docs-hooks'

export default function ApiDocumentationOperationPage() {
    const {doc, operationId} = useParams()
    const {spec, loaded, error} = useApiSpec(doc)
    const operation = spec?.operations.find(op => op.operationId === operationId)

    return <ApiDocsView>
        {!loaded ?
            <div className="loader"/> :
            error ?
                <ErrorNotificationBlock>{error}</ErrorNotificationBlock> :
                !operation ?
                    <NotFoundView/> :
                    <>
                        <h2>{spec.title}</h2>
                        <ApiPathView operation={operation}/>
                    </>}
    </ApiDocsView>
}
