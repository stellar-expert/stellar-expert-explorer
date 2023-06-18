import React from 'react'
import {useDependantState} from '@stellar-expert/ui-framework'
import Chart from '../../../components/chart/chart'
import {apiCall} from '../../../../models/api'

function trimEmptyDistributionValues(data) {
    for (let i = 0; i < 2; i++) {
        data.reverse()
        const pos = data.findIndex(d => d.holders > 0)
        data.splice(0, pos)
    }
}

export default function AssetDistributionChartView({asset}) {
    const [distribution, setDistribution] = useDependantState(() => {
        apiCall(`asset/${asset.descriptor.toFQAN()}/distribution`)
            .then(distribution => setDistribution(distribution))
            .catch(e => setDistribution(null))
    }, [asset.descriptor.toFQAN()])
    if (distribution === null)
        return null
    if (!asset || !distribution?.length)
        return <Chart.Loader/>
    trimEmptyDistributionValues(distribution)
    const code = asset.descriptor.toCurrency()
    const title = `${code} holders distribution`
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
                text: 'Accounts holding ' + code
            },
            type: 'logarithmic'
        }],
        series: [{
            type: 'column',
            name: 'Holders',
            data: distribution.map(d => [d.range + ' ' + code, d.holders])
        }]
    }
    return <Chart {...{title, options}}/>
}