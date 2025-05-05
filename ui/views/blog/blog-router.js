import React from 'react'
import {Route, Switch} from 'react-router'
import BlogIndex from './blog-index-view'
import BlogPost from './blog-post-view'
import NotFoundView from '../pages/not-found-page-view'

export default function BlogRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Route path={`${path}/:id`} component={BlogPost}/>
            <Route path={`${path}/`} component={BlogIndex}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}