import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import NotFoundView from '../pages/not-found-page-view'
import AssetListCatalogueView from './asset-list-catalogue-view'

export default function AssetListsRouter({match}) {
    const {path} = match
    return <div className="container">
        <RouterSwitch>
            <Route path={`${path}/`} component={AssetListCatalogueView}/>
            <Route component={NotFoundView}/>
        </RouterSwitch>
    </div>
}