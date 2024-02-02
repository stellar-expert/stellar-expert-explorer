import React from 'react'
import {Route, Redirect, Switch} from 'react-router'
import NotFoundView from '../pages/not-found-page-view'
import TokenListsView from './token-lists-view'
import TokenListDetailsView from './token-list-details-view'

function TokenListsRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Redirect from={`${match.path}/public`} to={match.path} push/>
            <Redirect from={`${match.path}/testnet`} to={match.path} push/>
            <Route path={`${path}/:name`} component={TokenListDetailsView}/>
            <Route path={`${path}/`} component={TokenListsView}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}

export default TokenListsRouter