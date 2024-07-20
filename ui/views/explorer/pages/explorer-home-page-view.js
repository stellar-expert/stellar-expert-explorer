import React from 'react'
import {setPageMetadata} from '../../../util/page-metadata-installer'
import appSettings from '../../../app-settings'
import CrawlerScreen from '../../components/crawler-screen'
import AssetList from '../asset/asset-list-view'
import LedgerActivity from '../ledger/ledger-activity-view'
import LedgerDailyStats from '../ledger/ledger-daily-stats'
import OperationsChart from '../ledger/charts/ledger-history-operations-ledger-time-chart-view'
import AccountsChart from '../ledger/charts/ledger-history-accounts-chart-view'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import AssetsOverallStatsView from '../asset/asset-overall-stats-view'

export default function ExplorerHomePageView() {
    if (!appSettings.activeNetwork) return null
    setPageMetadata({title: 'Ledger explorer and analytics platform for Stellar Network'})
    return <div>
        <div className="space text-center">
            <h1>Ledger explorer and analytics platform for <a href="https://www.stellar.org/">Stellar Network</a></h1>
        </div>
        <div className="space"/>
        <div className="row">
            <div className="column column-34">
                <div className="segment blank">
                    <h3>Asset Statistics</h3>
                    <hr className="flare"/>
                    <AssetsOverallStatsView/>
                </div>
            </div>
            <div className="space mobile-only"/>
            <div className="column column-34">
                <div className="segment blank">
                    <LedgerDailyStats/>
                </div>
            </div>
            <div className="space mobile-only"/>
            <div className="column column-34">
                <div className="segment blank">
                    <LedgerActivity/>
                </div>
            </div>
        </div>
        <div className="row space">
            <div className="column column-50">
                <CrawlerScreen as={<h3>Ledger Performance</h3>}>
                    <OperationsChart/>
                </CrawlerScreen>
                    <div className="space"/>
                <CrawlerScreen as={<h3>Accounts</h3>}>
                    <AccountsChart/>
                </CrawlerScreen>
                    <div className="space"/>
                <CrawlerScreen as={<h3>New Assets and Trustlines</h3>}>
                    <AssetsChart/>
                </CrawlerScreen>
            </div>
            <div className="space mobile-only"/>
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Assets on the Ledger</h3>
                    <hr className="flare"/>
                    <CrawlerScreen><AssetList compact/></CrawlerScreen>
                </div>
            </div>
        </div>
    </div>
}