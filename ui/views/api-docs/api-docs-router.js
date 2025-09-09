import React from 'react'
import {Route, Switch} from 'react-router'
import ApiDocsIntroPage from './pages/api-docs-intro-page'
import ApiDocsPathPage from './pages/api-docs-path-page'
import ApiDocsTagPage from './pages/api-docs-tag-page'
import NotFoundView from '../pages/not-found-page-view'

export default function ApiDocsRouter({match}) {
    const {path} = match
    return <Switch>
        <Route path={`${path}/:tag/:method/:id`} component={ApiDocsPathPage}/>
        <Route path={`${path}/:tag`} component={ApiDocsTagPage}/>
        <Route path={`${path}/`} component={ApiDocsIntroPage}/>
        <Route component={NotFoundView}/>
    </Switch>
}