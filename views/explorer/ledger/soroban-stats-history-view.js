import React, {useState} from 'react'
import {Dropdown, useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import Chart from '../../components/chart/chart'

export default withErrorBoundary(function SorobanStatsHistoryView() {
    const history = useExplorerApi('contract-stats-history')
    return <div>
        <div className="space">
            <SorobanInvocationsStatsChart history={history} title="Contract invocations"/>
        </div>
        <div className="space">
            <SorobanFeeStatsChart history={history} title="Charged contract fees"/>
        </div>
        <div className="space">
            <MetricStatsChart history={history}/>
        </div>
        <div className="space"/>
    </div>
})

const metricOptions = [
    {value: 'contracts_created', title: 'contracts created'},
    {value: 'total_uploads', title: 'contracts WASM uploads'},
    {value: 'total_read_entry', title: 'total entries read'},
    {value: 'total_write_entry', title: 'total entries written'},
    {value: 'total_ledger_read_byte', title: 'total ledger bytes read'},
    {value: 'total_ledger_write_byte', title: 'total ledger bytes written'},
    {value: 'total_read_code_byte', title: 'total contract code bytes read'},
    {value: 'total_emit_event', title: 'total emitted events'},
    {value: 'avg_invoke_time', title: 'average invocation time per call, µs'},
    {value: 'avg_nonrefundable_fee', title: 'average nonrefundable fee per call'},
    {value: 'avg_refundable_fee', title: 'average refundable fee per call'},
    {value: 'avg_rent_fee', title: 'average rent fee per call'}
]

function MetricStatsChart({history}) {
    const [metric, setMetric] = useState('contracts_created')
    const option = metricOptions.find(option => option.value === metric)
    return <div>
        <h3>Contract invocation metrics: <Dropdown options={metricOptions} onChange={setMetric} value={metric}/></h3>
        <SorobanStatsChart history={history} title={capitalize(option.title)} field={metric} suffix={option.suffix}/>
    </div>
}

function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
}

function SorobanStatsChart({history, title, field, suffix}) {
    const config = generateSingleFieldConfig(history, title, field, suffix)
    return <Chart type="StockChart" title={title} className="space" options={config} grouped range noLegend/>
}

function generateSingleFieldConfig({loaded, data}, title, field, suffix) {
    if (!loaded || !(data instanceof Array))
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

    const columnConfig = {
        type: 'column',
        name: title,
        data: resData
    }
    if (suffix) {
        columnConfig.tooltip = {
            valueSuffix: ' ' + suffix
        }
    }
    config.series.push(columnConfig)
    return config
}

function SorobanInvocationsStatsChart({history, title}) {
    if (!history.loaded)
        return <Chart.Loader/>
    if (!(history?.data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                },
                stacking: 'normal'
            }
        },
        yAxis: [{
            title: {
                text: title
            }
        }],
        series: []
    }
    const invocations = []
    const subinvocations = []
    const errors = []
    for (const record of history.data) {
        const ts = record.ts * 1000
        invocations.push([ts, record.total_invocations])
        subinvocations.push([ts, record.total_subinvocations])
        //errors.push([ts, record.total_errors])
    }

    config.series.push({
        type: 'column',
        name: 'Contract invocations',
        data: invocations
    })

    config.series.push({
        type: 'column',
        name: 'Contract subinvocations',
        data: subinvocations
    })
    return <Chart type="StockChart" title={title} options={config} grouped range noLegend/>
}


function SorobanFeeStatsChart({history, title}) {
    if (!history.loaded)
        return <Chart.Loader/>
    if (!(history?.data instanceof Array))
        return <Chart.Loader unavailable/>
    const config = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                },
                stacking: 'normal',
                tooltip: {
                    valueSuffix: ' XLM'
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
    const refundable = []
    const nonrefundable = []
    const rent = []
    for (const record of history.data) {
        const ts = record.ts * 1000
        refundable.push([ts, Math.floor(record.total_refundable_fee / 10_000_000)])
        nonrefundable.push([ts, Math.floor(record.total_nonrefundable_fee / 10_000_000)])
        rent.push([ts, Math.floor(record.total_rent_fee / 10_000_000)])
    }

    config.series.push({
        type: 'column',
        name: 'Refundable fees, XLM',
        data: refundable
    })

    config.series.push({
        type: 'column',
        name: 'Nonrefundable fees, XLM',
        data: nonrefundable
    })
    config.series.push({
        type: 'column',
        name: 'Rent fees, XLM',
        data: rent
    })
    return <Chart type="StockChart" title={title} options={config} grouped range noLegend/>
}