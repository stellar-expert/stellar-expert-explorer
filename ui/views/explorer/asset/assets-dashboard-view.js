import React from 'react'
import AssetList from './asset-list-view'
import AssetsOverallStatsView from './asset-overall-stats-view'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'

export default function AssetsDashboard() {
    setPageMetadata({
        title: 'Analytics for all assets, anchors, ICOs, tokens issued on Stellar Network',
        description: 'Comprehensive analytics, key technical parameters, trading volume, and price dynamics for all Stellar assets, anchors, ICOs, utility tokens.'
    })
    return <div>
        <h2>All Assets on Stellar Ledger</h2>
        <div className="row">
            <div className="column column-40">
                <div className="card">
                    <h3>Summary</h3>
                    <hr/>
                    <AssetsOverallStatsView/>
                </div>
            </div>
            <div className="column column-60">
                <div className="card">
                    <AssetsChart/>
                </div>
            </div>
        </div>
        <div className="card space">
            <h3>Assets on the Ledger</h3>
            <hr/>
            <AssetList/>
        </div>
    </div>
}