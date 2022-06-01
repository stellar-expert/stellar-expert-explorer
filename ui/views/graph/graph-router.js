import {Route, Switch} from 'react-router'
import GraphView from './graph-view'
import NotFoundView from '../pages/not-found-page-view'
import React from 'react'

export default function GraphRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Route path={`${path}`} exact component={GraphView}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}