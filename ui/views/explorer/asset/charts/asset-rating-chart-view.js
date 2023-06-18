import React from 'react'
import Chart from '../../../components/chart/chart'

export default Chart.withErrorBoundary(function AssetRatingChartView({asset}) {
    if (!asset.rating)
        return <Chart.Loader/>
    const config = {
        chart: {
            polar: true,
            type: 'line',
            height: '60%'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y:.1f}</b><br/>'
        },
        pane: {
            size: '75%'
        },
        xAxis: {
            categories: ['Age', 'Payments', 'Trustlines', 'Interoperability', 'Weekly volume', 'Trades', 'Liquidity'],
            tickmarkPlacement: 'on',
            lineWidth: 0,
            crosshair: false
        },
        yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            minorTickInterval: 2,
            tickAmount: 0,
            min: 0,
            max: 11
        },
        series: []
    }

    const {age, payments, trustlines, trades, volume7d, interop, liquidity} = asset.rating
    config.series.push({
        name: 'Rating',
        pointPlacement: 'on',
        data: [age, payments, trustlines, interop, volume7d, trades, liquidity]
    })
    return <Chart title="Rating" options={config} noLegend/>
})