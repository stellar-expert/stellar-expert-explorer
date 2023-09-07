import React from 'react'
import {Route, Switch} from 'react-router'
import NotFoundView from '../pages/not-found-page-view'
import GraphView from './graph-view'

export default function GraphRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Route path={`${path}`} exact component={GraphView}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}