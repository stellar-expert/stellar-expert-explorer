import React from 'react'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerHistoryAccountsChartView({noTitle, className}) {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        yAxis: [{
            title: {
                text: 'Total Existing Accounts'
            },
            opposite: false
        }],/*, {
            title: {
                text: 'Daily Active Accounts'
            },
            opposite: true
        }],*/
        series: []
    }
    const dataAccounts = []
    //const dataActiveAccounts = []
    for (const {ts, daily_active_accounts, accounts} of data) {
        const dt = ts * 1000
        dataAccounts.push([dt, accounts])
        //dataActiveAccounts.push([dt, daily_active_accounts])
    }

    config.series.push({
        type: 'area',
        name: '# of Accounts',
        data: dataAccounts,
        dataGrouping: {
            approximation: 'close'
        }
    })
    /*config.series.push({
        type: 'spline',
        name: 'Daily Active Accounts',
        yAxis: 1,
        data: dataActiveAccounts,
        dataGrouping: {
            approximation: 'high'
        }
    })*/
    return <Chart type="StockChart" options={config} className={className} grouped range title={noTitle ? null : <>
        Accounts
        <EmbedWidgetTrigger path="network-activity/accounts" title="Stellar Network Stats - Accounts"/>
    </>}/>
})