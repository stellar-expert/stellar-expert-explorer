import React from 'react'
import {Tabs, usePageMetadata} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import CrawlerScreen from '../../components/crawler-screen'
import LedgerActivity from '../ledger/ledger-activity-view'
import LedgerDailyStats from '../ledger/ledger-daily-stats'
import OperationsChart from '../ledger/charts/ledger-history-operations-ledger-time-chart-view'
import AccountsChart from '../ledger/charts/ledger-history-accounts-chart-view'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import PaymentsTradesChart from '../ledger/charts/ledger-history-payments-trades-chart-view'
import SupplyChart from '../ledger/charts/ledger-supply-fee-chart-view'
import FailedTransactions from '../ledger/charts/ledger-history-failed-transactions-chart-view'
import SorobanGeneralStatsView from '../ledger/soroban-general-stats-view'
import SorobanStatsHistoryView from '../ledger/soroban-stats-history-view'

export default function NetworkActivityPageView() {
    usePageMetadata({
        title: `Activity on Stellar ${config.activeNetwork} network`,
        description: `Stats and activity indicators for Stellar ${config.activeNetwork} network.`
    })
    const tabs = [
        {
            name: 'general',
            title: 'General',
            isDefault: true,
            render: () => <GeneralNetworkStats/>
        },
        {
            name: 'soroban',
            title: 'Soroban',
            render: () => <SorobanActivityPageView/>
        }
    ]

    return <>
        <h2>Network Stats</h2>
        <div style={{marginBottom: '-2.6em'}}/>
        <Tabs right tabs={tabs} queryParam="tab"/>
    </>
}

function GeneralNetworkStats() {
    return <>
        <div className="row">
            <div className="column column-50">
                <div className="segment blank">
                    <LedgerActivity/>
                </div>
            </div>
            <div className="column column-50">
                <div className="segment blank">
                    <LedgerDailyStats className="column column-50"/>
                </div>
            </div>
        </div>
        <CrawlerScreen>
            <div className="space"/>
            <OperationsChart/>
            <div className="space"/>
            <AccountsChart/>
            <div className="space"/>
            <AssetsChart/>
            <div className="space"/>
            <PaymentsTradesChart/>
            <div className="space"/>
            <SupplyChart/>
            <div className="space"/>
            <FailedTransactions/>
        </CrawlerScreen>
    </>
}


function SorobanActivityPageView() {
    return <>
        <SorobanGeneralStatsView/>
        <CrawlerScreen>
            <div className="space"></div>
            <SorobanStatsHistoryView/>
        </CrawlerScreen>
    </>
}