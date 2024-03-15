import React from 'react'
import {useExplorerApi} from '@stellar-expert/ui-framework'
import Chart from '../../components/chart/chart'

export default function SorobanStatsHistoryView() {
    const history = useExplorerApi('contract-stats-history')
    return <div>
        <SorobanStatsChart history={history} title="Contract invocations" field="invocations"/>
        <SorobanStatsChart history={history} title="Contracts created" field="newWasmUploaded"/>
        <SorobanStatsChart history={history} title="Unique WASM uploads" field="newContractsCreated"/>
    </div>
}

function SorobanStatsChart({history, title, field}){
    const config = generateConfig(history, title, field)
    return <Chart type="StockChart" title={title} className="space" options={config} grouped range noLegend/>
}

function generateConfig({loaded, data}, title, field) {
    if (!loaded)
        return null
    const config = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            }
        },
        yAxis: [{
            title: {
                text: title
            }
        }],
        series: []
    }
    const resData = []
    for (const record of data) {
        resData.push([record.ts * 1000, record[field]])
    }

    config.series.push({
        type: 'column',
        name: title,
        data: resData
    })
    return config
}