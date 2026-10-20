import React from 'react'
import {Route, RouterSwitch} from '@stellar-expert/ui-framework'
import LostPayment from './lost-payment-view'
import NotFoundView from '../pages/not-found-page-view'
import TOS from '../pages/tos-page-view'
import PrivacyPageView from '../pages/privacy-page-view'
import RefundPageView from '../pages/refund-page-view'

export default function InfoRouter({match}) {
    const {path} = match
    return <div className="container narrow">
        <RouterSwitch>
            <Route path={`${path}/lost-payment`} component={LostPayment}/>
            <Route path={`${path}/tos`} component={TOS}/>
            <Route path={`${path}/privacy`} component={PrivacyPageView}/>
            <Route path={`${path}/refund`} component={RefundPageView}/>
            <Route component={NotFoundView}/>
        </RouterSwitch>
    </div>
}