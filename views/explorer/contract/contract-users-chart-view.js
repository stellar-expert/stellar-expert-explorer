import React from 'react'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function ContractUsersChartView({contract, users, title}) {
    const data = users.slice(0, 5).map(d => ({
        name: shortenString(d.address),
        y: d.invocations,
        z: 100
    }))
    if (users.length > 5) {
        data.push({
            name: 'Other',
            y: users.slice(5).reduce((a, b) => a + b.invocations, 0),
            z: 100
        })
    }
    const options = {
        tooltip: {
            pointFormatter
        },
        chart: {
            type: 'variablepie'
        },
        series: [{
            minPointSize: 10,
            innerSize: '40%',
            zMin: 0,
            name: 'Invocations',
            borderRadius: 5,
            data
        }]
    }
    return <Chart {...{options, title}} type="Chart" grouped range/>
})


function pointFormatter() {
    return `<b>${formatWithAutoPrecision(this.y)}</b><br/>`
}