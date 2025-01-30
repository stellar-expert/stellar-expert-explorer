import React from 'react'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import CrawlerScreen from '../../components/crawler-screen'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import AssetsOverallStatsView from './asset-overall-stats-view'
import AssetList from './asset-list-view'

export default function AssetsDashboard() {
    setPageMetadata({
        title: 'Analytics for all assets, anchors, ICOs, tokens issued on Stellar Network',
        description: 'Comprehensive analytics, key technical parameters, trading volume, and price dynamics for all Stellar assets, anchors, ICOs, utility tokens.'
    })
    return <>
        <h2>All Assets on Stellar Ledger</h2>
        <div className="row">
            <div className="column column-40">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <AssetsOverallStatsView/>
                </div>
            </div>
            <div className="column column-60">
                <CrawlerScreen><AssetsChart/></CrawlerScreen>
            </div>
        </div>
        <CrawlerScreen>
            <div className="segment blank space">
                <div className="double-space"></div>
                <AssetList/>
            </div>
        </CrawlerScreen>
    </>
}