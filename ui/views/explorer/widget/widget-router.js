import React from 'react'
import {Switch, Route, useRouteMatch} from 'react-router'
import NotFoundView from '../../pages/not-found-page-view'
import AccountWidget from './account-widget'
import AssetWidget from './asset-widget'
import NetworkWidget from './network-widget'
import TxWidget from './tx-widget'

export default function WidgetRouter() {
    const {path, params} = useRouteMatch()
    return <Switch>
        <Route path={`${path}/account/:snippet/:id`} component={AccountWidget}/>
        <Route path={`${path}/asset/:snippet/:id`} component={AssetWidget}/>
        <Route path={`${path}/network-activity/:snippet`} component={NetworkWidget}/>
        <Route path={`${path}/tx/info/:id`} component={TxWidget}/>
        {/*not found*/}
        <Route component={NotFoundView}/>
    </Switch>
}