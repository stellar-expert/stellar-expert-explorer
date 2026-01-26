import React from 'react'
import {useAssetMeta} from '@stellar-expert/ui-framework'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'
import Chart from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {day, trimDate} from '../../../../util/date-utils'

export default Chart.withErrorBoundary(function AssetSupplyChartView({asset, noTitle}) {
    const {data, loaded} = useAssetHistory(asset.descriptor)
    const assetMeta = useAssetMeta(asset.asset)
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
    let maxTs = 0

    if (data.history) {
        for (const {ts, supply, reserve, fee_pool, trustlines} of data.history) {
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
                    if (fee_pool) {
                        s -= fee_pool
                    }
                    assetSupply.push([timestamp, Math.round(s / 100000) / 100])
                }
                if (trustlines) {
                    assetTrustlines.push([timestamp, trustlines[2]])
                }
            }
        }
    }

    if (assetSupply?.length) {
        assetSupply.unshift([assetSupply[0][0] - day * 1000, 0])
        assetTrustlines.unshift([assetTrustlines[0][0] - day * 1000, 0])
    }

    const today = trimDate(new Date(), day) * 1000;
    [assetSupply, assetTrustlines].forEach(container => {
        const last = container[container.length - 1]
        if (last[0] < today) {
            container.push([today, last[1]])
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
            valueSuffix: ' ' + (assetMeta?.code || asset.descriptor.toCurrency())
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