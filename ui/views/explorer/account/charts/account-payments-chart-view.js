import React from 'react'
import Chart from '../../../components/chart-view'
import {useAccountStatsHistory} from '../../../../business-logic/api/account-api'

export default function AccountPaymentsChartView({address}) {
    const {data = [], loaded} = useAccountStatsHistory(address)
    if (!loaded) return null
    const config = {
        plotOptions: {
            column: {
                stacking: 'normal',
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum',
                    forced: true,
                    groupPixelWidth: 12
                }
            },
            spline: {
                connectNulls: true
            },
            dataGrouping: {
                approximation: 'sum',
                groupPixelWidth: 16
            }
        },
        yAxis: [{
            title: {
                text: 'Account payments'
            },
            opposite: false
        }],
        series: []
    }
    const payments = data.map(({ts, payments}) => [ts * 1000, payments])
    //res.xAxis.categories = ts

    config.series.push({
        type: 'column',
        name: 'Payments',
        data: payments
    })
    return <Chart type="StockChart" options={config} grouped range={true} noLegend/>
}