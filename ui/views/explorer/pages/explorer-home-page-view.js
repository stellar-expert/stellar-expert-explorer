import React from 'react'
import appSettings from '../../../app-settings'
import AssetList from '../asset/asset-list-view'
import LedgerActivity from '../ledger/ledger-activity-view'
import LedgerDailyStats from '../ledger/ledger-daily-stats'
import OperationsChart from '../ledger/charts/ledger-history-operations-ledger-time-chart-view'
import AccountsChart from '../ledger/charts/ledger-history-accounts-chart-view'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import AssetsOverallStatsView from '../asset/asset-overall-stats-view'

export default function ExplorerHomePageView() {
    if (!appSettings.activeNetwork) return null
    return <div>
        <div className="space text-center">
            <h1>Ledger explorer and analytics platform for <a href="https://www.stellar.org/">Stellar Network</a></h1>
        </div>
        <div className="space"/>
        <div className="row">
            <div className="column column-34">
                <div className="card">
                    <h3>Asset Statistics</h3>
                    <hr/>
                    <AssetsOverallStatsView/>
                </div>
            </div>
            <div className="column column-34">
                <div className="card">
                    <LedgerDailyStats/>
                </div>
            </div>
            <div className="column column-34">
                <div className="card">
                    <LedgerActivity/>
                </div>
            </div>
        </div>
        <div className="row space">
            <div className="column column-50">
                <div className="card">
                    <h3>Network Stats</h3>
                    <hr/>
                    <OperationsChart/>
                    <AccountsChart/>
                    <AssetsChart/>
                </div>
            </div>
            <div className="column column-50">
                <div className="card">
                    <h3>Assets on the Ledger</h3>
                    <hr/>
                    <AssetList compact/>
                </div>
            </div>
        </div>
    </div>
}