import React from 'react'
import {RouterSwitch, Route, useRouteMatch} from '@stellar-expert/ui-framework'
import NotFoundView from '../../pages/not-found-page-view'
import AccountWidget from './account-widget'
import AssetWidget from './asset-widget'
import NetworkWidget from './network-widget'
import TxWidget from './tx-widget'

export default function WidgetRouter() {
    const {path} = useRouteMatch()
    return <RouterSwitch>
        <Route path={`${path}/account/:snippet/:id`} component={AccountWidget}/>
        <Route path={`${path}/asset/:snippet/:id`} component={AssetWidget}/>
        <Route path={`${path}/network-activity/:snippet`} component={NetworkWidget}/>
        <Route path={`${path}/tx/info/:id`} component={TxWidget}/>
        {/*not found*/}
        <Route component={NotFoundView}/>
    </RouterSwitch>
}