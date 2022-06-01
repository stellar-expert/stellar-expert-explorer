import React from 'react'
import Chart from '../../../components/chart-view'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default function LedgerHistoryPaymentsTradesChartView({className, noTitle}) {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded) return null
    const config = {
        plotOptions: {
            series: {
                clip: true,
                dataGrouping: {
                    groupPixelWidth: 30
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Payments and Trades'
            },
            height: '86%',
            offset: 40

        }, {
            title: {
                text: 'Volume'
            },
            top: '86%',
            height: '14%',
            offset: 40
        }],
        series: []
    }
    const dataTrades = [],
        dataPayments = [],
        dataVolume = []
    for (let {ts, payments, trades, volume} of data) {
        const dt = ts * 1000
        dataPayments.push([dt, payments])
        dataTrades.push([dt, trades])
        dataVolume.push([dt, Math.round(volume / 10000000)])
    }

    config.series.push({
        type: 'column',
        name: 'Payments',
        data: dataPayments,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    config.series.push({
        type: 'column',
        name: 'DEX Volume',
        yAxis: 1,
        tooltip: {valueSuffix: ' XLM'},
        data: dataVolume,
        index: 2,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    config.series.push({
        type: 'column',
        name: 'Trades',
        data: dataTrades,
        index: 1,
        dataGrouping: {
            approximation: 'sum'
        }
    })
    return <Chart type="StockChart" options={config} className={className} grouped range title={noTitle ? null : <>
        Payments and Trades
        <EmbedWidgetTrigger path="network-activity/payments" title="Stellar Network - Payments and Trades"/>
    </>}/>
}
