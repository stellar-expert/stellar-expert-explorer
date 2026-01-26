import React from 'react'
import {useAssetMeta, useExplorerApi} from '@stellar-expert/ui-framework'
import Chart from '../../../components/chart/chart'

function trimEmptyDistributionValues(data) {
    for (let i = 0; i < 2; i++) {
        data.reverse()
        const pos = data.findIndex(d => d.holders > 0)
        data.splice(0, pos)
    }
}

export default function AssetDistributionChartView({asset}) {
    const assetMeta = useAssetMeta(asset.asset)
    const {data: distribution, loaded} = useExplorerApi(`asset/${asset.descriptor.toFQAN()}/distribution`)
    if (!loaded)
        return <Chart.Loader/>
    if (!distribution?.length)
        return null
    trimEmptyDistributionValues(distribution)
    const assetCode = assetMeta?.code || asset.descriptor.toCurrency()
    const title = `${assetCode} holders distribution`
    const options = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                }
            }
        },
        xAxis: {
            type: 'category'
        },
        yAxis: [{
            title: {
                text: 'Accounts holding ' + assetCode
            },
            type: 'logarithmic'
        }],
        series: [{
            type: 'column',
            name: 'Holders',
            data: distribution.map(d => [d.range + ' ' + assetCode, d.holders])
        }]
    }
    return <Chart {...{title, options}}/>
}