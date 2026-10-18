import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import NotFoundView from '../../pages/not-found-page-view'
import ErrorNotificationBlock from '../../components/error-notification-block'
import ApiDocsView from '../api-docs-view'
import ApiPathView from '../api-path-view'
import {useApiCatalog, useApiSpec} from '../api-docs-hooks'
import {findAdjacentOperations} from '../api-docs-catalog'

export default function ApiDocumentationOperationPage() {
    const {doc, operationId} = useParams()
    const {spec, loaded, error} = useApiSpec(doc)
    const {catalog} = useApiCatalog()
    const operation = spec?.operations.find(op => op.operationId === operationId)

    return <ApiDocsView>
        {!loaded ?
            <div className="loader"/> :
            error ?
                <ErrorNotificationBlock>{error}</ErrorNotificationBlock> :
                !operation ?
                    <NotFoundView/> :
                    <ApiPathView spec={spec} operation={operation} adjacent={findAdjacentOperations(catalog, spec.slug, operationId)}/>}
    </ApiDocsView>
}
