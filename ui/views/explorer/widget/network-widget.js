import React from 'react'
import {useRouteMatch} from 'react-router'
import ErrorNotificationBlock from '../../components/error-notification-block'
import LedgerActivityView from '../ledger/ledger-activity-view'
import LedgerDailyStatsView from '../ledger/ledger-daily-stats'
import LedgerPerformanceChart from '../ledger/charts/ledger-history-operations-ledger-time-chart-view'
import LedgerHistoryAccountsChart from '../ledger/charts/ledger-history-accounts-chart-view'
import LedgerHistoryAssetsTrustlinesChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import LedgerHistoryPaymentsTradesChart from '../ledger/charts/ledger-history-payments-trades-chart-view'
import LedgerSupplyFeeChart from '../ledger/charts/ledger-supply-fee-chart-view'
import Widget from './widget'

export default function NetworkWidget() {
    const {params} = useRouteMatch()

    switch (params.snippet) {
        case 'ledger':
            return <Widget>
                <LedgerActivityView title="Live Stellar Network Stats - Ledger "/>
            </Widget>
        case '24h':
            return <Widget>
                <LedgerDailyStatsView title="Stellar Network 24h Stats"/>
            </Widget>
        case 'performance':
            return <Widget center>
                <h2>Stellar Network - Ledger Performance</h2>
                <LedgerPerformanceChart noTitle/>
            </Widget>
        case 'accounts':
            return <Widget center>
                <h2>Stellar Network - Account Stats</h2>
                <LedgerHistoryAccountsChart noTitle/>
            </Widget>
        case 'assets':
            return <Widget center>
                <h2>Stellar Network - New Assets and Trustlines</h2>
                <LedgerHistoryAssetsTrustlinesChart noTitle/>
            </Widget>
        case 'payments':
            return <Widget center>
                <h2>Stellar Network - Payments and Trades</h2>
                <LedgerHistoryPaymentsTradesChart noTitle/>
            </Widget>
        case 'supply-fee':
            return <Widget center>
                <h2>Stellar Network - Circulating XLM Supply and Fee Pool</h2>
                <LedgerSupplyFeeChart noTitle/>
            </Widget>
        default:
            throw new TypeError('Not supported snippet type: ' + params.snippet)
    }

    return <ErrorNotificationBlock>Invalid widget request</ErrorNotificationBlock>
}