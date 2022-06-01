import {Route, Switch} from 'react-router'
import LostPayment from './lost-payment-view'
import NotFoundView from '../pages/not-found-page-view'
import React from 'react'

export default function InfoRouter({match}) {
    const {path} = match
    return <div className="container narrow">
        <Switch>
            <Route path={`${path}/lost-payment`} component={LostPayment}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}