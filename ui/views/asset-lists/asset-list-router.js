import React from 'react'
import {Route, Redirect, Switch} from 'react-router'
import NotFoundView from '../pages/not-found-page-view'
import AssetListCatalogueView from './asset-list-catalogue-view'

export default function AssetListsRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Route path={`${path}/`} component={AssetListCatalogueView}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}