import React from 'react'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default Chart.withErrorBoundary(function AssetSupplyChartView({asset, noTitle}) {
    const {data, loaded} = useAssetHistory(asset.descriptor)
    if (!loaded)
        return <Chart.Loader/>
    if (!(data?.history instanceof Array))
        return <Chart.Loader unavailable/>
    const options = {
        plotOptions: {
            series: {
                step: 'left'
            },
            area: {
                marker: {
                    enabled: false
                },
                min: 0
            },
            spline: {
                marker: {
                    enabled: false
                },
                connectNulls: true
            }
        },
        yAxis: [{
            title: {
                text: 'Supply'
            },
            opposite: false,
            min: 0
        }, {
            title: {
                text: 'Asset holders'
            },
            opposite: true,
            min: 0
        }],
        series: []
    }

    const assetSupply = []
    const assetTrustlines = []
    const day = 24 * 60 * 60 * 1000
    let maxTs = 0

    if (data.history) {
        for (const {ts, supply, reserve, feePool, trustlines} of data.history) {
            if (ts > 0) {
                const timestamp = ts

                if (timestamp > maxTs) {
                    maxTs = timestamp
                }

                if (typeof supply === 'number') {
                    let s = supply
                    if (reserve) {
                        s -= reserve
                    }
                    if (feePool) {
                        s -= feePool
                    }
                    assetSupply.push([timestamp, Math.round(s / 100000) / 100])
                }
                if (trustlines) {
                    assetTrustlines.push([timestamp, trustlines[2]])
                }
            }
        }
    }

    if (assetSupply && assetSupply.length) {
        assetSupply.unshift([assetSupply[0][0] - day, 0])
        assetTrustlines.unshift([assetTrustlines[0][0] - day, 0])
    }

    [assetSupply, assetTrustlines].forEach(container => {
        const lastValue = container[container.length - 1]
        if (lastValue !== undefined) {
            if (lastValue[0] < maxTs && lastValue[1] !== 0) {
                container.push([maxTs, lastValue[1]])
            }
        }
    })

    options.series.push({
        type: 'area',
        connectNulls: true,
        name: 'Circulating supply',
        dataGrouping: {
            approximation: 'close'
        },
        tooltip: {
            valueSuffix: ' ' + asset.descriptor.toCurrency()
        },
        data: assetSupply
    })

    options.series.push({
        type: 'spline',
        name: 'Asset holders',
        yAxis: 1,
        dataGrouping: {
            approximation: 'close'
        },
        data: assetTrustlines
    })

    return <Chart type="StockChart" options={options} grouped range={true} noLegend
                  title={!noTitle && <>Supply and Accounts <EmbedWidgetTrigger
                      path={`asset/supply/${asset.descriptor.toString()}`}
                      title="Asset Supply and Accounts"/></>}/>
})