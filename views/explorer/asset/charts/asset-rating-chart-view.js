import React from 'react'
import Chart from '../../../components/chart/chart'

export default Chart.withErrorBoundary(function AssetRatingChartView({asset}) {
    if (!asset.rating)
        return <Chart.Loader unavailable title="Rating - N/A"/>
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
            categories: ['Age', 'Activity', 'Trustlines', 'Interoperability', 'Weekly volume', 'Liquidity'],
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

    const {age, activity, trustlines, volume7d, interop, liquidity, average} = asset.rating
    config.series.push({
        name: 'Rating',
        pointPlacement: 'on',
        data: [age, activity, trustlines, interop, volume7d, liquidity]
    })
    return <Chart title={'Rating - ' + (average || 'N/A')} options={config} noLegend/>
})