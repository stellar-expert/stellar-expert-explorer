import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import NotFoundView from '../pages/not-found-page-view'
import GraphView from './graph-view'

export default function GraphRouter({match}) {
    const {path} = match
    return <div className="container">
        <RouterSwitch>
            <Route path={`${path}`} exact component={GraphView}/>
            <Route component={NotFoundView}/>
        </RouterSwitch>
    </div>
}