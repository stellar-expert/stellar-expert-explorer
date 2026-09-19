import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import ApiDocumentationIntroPage from './pages/api-documentation-intro-page'
import ApiDocumentationOperationPage from './pages/api-documentation-operation-page'
import ApiDocumentationDocPage from './pages/api-documentation-doc-page'
import NotFoundView from '../pages/not-found-page-view'

export default function ApiDocsRouter({match}) {
    const {path} = match
    return <RouterSwitch>
        <Route path={`${path}/:doc/:operationId`} component={ApiDocumentationOperationPage}/>
        <Route path={`${path}/:doc`} component={ApiDocumentationDocPage}/>
        <Route path={`${path}/`} component={ApiDocumentationIntroPage}/>
        <Route component={NotFoundView}/>
    </RouterSwitch>
}
