import React from 'react'
import {SystemDialog} from '@stellar-expert/ui-framework'
import PricingHeaderView from './pricing-header-view'
import CatcherView from '../layout/catcher-view'
import PricingFooterView from './pricing-footer-view'
import PricingView from './pricing-view'

/**
 * Standalone layout for the public pricing landing
 * @return {JSX.Element}
 */
export default function PricingLayout() {
    return <div className="page-wrapper pricing-page">
        <div className="blue-ribbon"/>
        <PricingHeaderView/>
        <div className="page-container">
            <CatcherView><PricingView/></CatcherView>
        </div>
        <PricingFooterView/>
        <SystemDialog/>
    </div>
}