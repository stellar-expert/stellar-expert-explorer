import React from 'react'
import config from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import LedgerActivity from '../ledger/ledger-activity-view'
import LedgerDailyStats from '../ledger/ledger-daily-stats'
import OperationsChart from '../ledger/charts/ledger-history-operations-ledger-time-chart-view'
import AccountsChart from '../ledger/charts/ledger-history-accounts-chart-view'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import PaymentsTradesChart from '../ledger/charts/ledger-history-payments-trades-chart-view'
import SupplyChart from '../ledger/charts/ledger-supply-fee-chart-view'
import OperationsDistribution from '../ledger/charts/ledger-history-operations-distribution-chart-view'
import FailedTransactions from '../ledger/charts/ledger-history-failed-transactions-chart-view'

export default function NetworkActivityPageView() {
    setPageMetadata({
        title: `Activity on Stellar ${config.activeNetwork} network`,
        description: `Stats and activity indicators for Stellar ${config.activeNetwork} network.`
    })
    return <>
        <h2>Network Stats</h2>
        <div className="row">
            <div className="column column-50">
                <div className="card">
                    <LedgerActivity/>
                </div>
            </div>
            <div className="column column-50">
                <div className="card">
                    <LedgerDailyStats className="column column-50"/>
                </div>
            </div>
        </div>
        <div className="card space">
            <OperationsChart/>
        </div>
        <div className="card space">
            <AccountsChart/>
        </div>
        <div className="card space">
            <AssetsChart/>
        </div>
        <div className="card space">
            <PaymentsTradesChart/>
        </div>
        <div className="card space">
            <SupplyChart/>
        </div>
        <div className="card space">
            <OperationsDistribution/>
        </div>
        <div className="card space">
            <FailedTransactions/>
        </div>
    </>
}