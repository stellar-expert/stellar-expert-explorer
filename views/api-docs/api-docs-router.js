import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import ApiDocumentationIntroPage from './pages/api-documentation-intro-page'
import ApiDocumentationPathPage from './pages/api-documentation-path-page'
import ApiDocumentationTagPage from './pages/api-documentation-tag-page'
import NotFoundView from '../pages/not-found-page-view'

export default function ApiDocsRouter({match}) {
    const {path} = match
    return <RouterSwitch>
        <Route path={`${path}/:tag/:method/:id`} component={ApiDocumentationPathPage}/>
        <Route path={`${path}/:tag`} component={ApiDocumentationTagPage}/>
        <Route path={`${path}/`} component={ApiDocumentationIntroPage}/>
        <Route component={NotFoundView}/>
    </RouterSwitch>
}