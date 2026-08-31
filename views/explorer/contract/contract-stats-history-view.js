import React, {useMemo, useState} from 'react'
import {Dropdown, useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import Chart from '../../components/chart/chart'
import ContractFunctionSelectorView from './contract-function-selector-view'

const metricOptions = [
    {value: 'avg_write_entry', title: 'average entries written per call'},
    {value: 'avg_read_entry', title: 'average entries read per call'},
    {value: 'avg_ledger_read_byte', title: 'average ledger bytes read per call'},
    {value: 'avg_ledger_write_byte', title: 'average ledger bytes written per call'},
    {value: 'avg_emit_event', title: 'average emitted event per calls'},
    {value: 'avg_invoke_time', title: 'average invocation time per call, µs'},
    {value: 'avg_nonrefundable_fee', title: 'average nonrefundable fee per call', suffix: 'XLM'},
    {value: 'avg_refundable_fee', title: 'average refundable fee per call', suffix: 'XLM'},
    {value: 'avg_rent_fee', title: 'average rent fee per call', suffix: 'XLM'}
]

const periodOptions = [
    {value: 7, title: 'week'},
    {value: 30, title: 'month'},
    {value: 90, title: '3 months'}
]

export default withErrorBoundary(function ContractStatsHistoryView({contract, functions}) {
    const [func, setFunc] = useState('all')
    const [period, setPeriod] = useState(30)
    const [metric, setMetric] = useState('avg_ledger_read_byte')
    const since = useMemo(() => Math.floor(new Date().getTime() / 1000) - period * 24 * 60 * 60, [contract])
    let apiUrl = `contract/${contract}/invocation-stats?since=${since}`
    if (func !== 'all') {
        apiUrl += '&func=' + encodeURIComponent(func)
    }
    const history = useExplorerApi(apiUrl)
    if (!history.loaded || !functions)
        return <div className="segment blank">
            <div className="loader large"/>
        </div>
    if (!history.data?.length)
        return <div className="segment blank">
            <div className="space dimmed text-center text-small">(invocations history not available)</div>
        </div>

    const invocationsChartTitle = 'Contract metrics'
    return <div className="segment blank">
        <div>
            Function: <ContractFunctionSelectorView functions={functions} onChange={setFunc} func={func}/>&emsp;
            <div className="mobile-only"/>
            Period: <Dropdown options={periodOptions} onChange={setPeriod} value={period}/>&emsp;
            <div className="mobile-only"/>
            Metric: <Dropdown options={metricOptions} onChange={setMetric} value={metric}/>
        </div>
        <div className="row">
            <div className="column column-50">
                <SorobanInvocationsStatsChart history={history} title={invocationsChartTitle}/>
            </div>
            <div className="column column-50">
                <ContractMetricStatsChart history={history} metric={metric}/>
            </div>
            <div className="space"/>
        </div>
    </div>
})

function ContractMetricStatsChart({history, metric}) {
    const option = metricOptions.find(option => option.value === metric)
    const config = generateSingleFieldConfig(history, capitalize(option.title), metric, option.suffix)
    return <Chart type="Chart" title="Detailed metrics" container="" options={config} grouped noLegend/>
}

function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
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
        let value = record[field]
        if (field.endsWith('_fee')) {
            value = parseFloat((value / 10_000_000).toFixed(5))
        }
        resData.push([record.ts * 1000, value])
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
        data: invocations,
        minPointSize: 5
    })

    config.series.push({
        type: 'column',
        name: 'Contract subinvocations',
        data: subinvocations,
        minPointSize: 5
    })
    return <Chart type="Chart" title="Contract invocations" options={config} container="" grouped noLegend/>
}