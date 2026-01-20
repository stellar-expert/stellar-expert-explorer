import React, {useEffect, useState} from 'react'
import {Amount} from '@stellar-expert/ui-framework'
import {fromStroops} from '@stellar-expert/formatter'

export default function FeeStatsView({lastLedger}) {
    const [feeStats, setFeeStats] = useState()
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        setIsError(false)
        if (!lastLedger)
            return setIsError(true)
        fetch('https://horizon.stellar.org/fee_stats')
            .then(res => res.json())
            .then(res => setFeeStats(res))
            .catch(err => setIsError(err))
    }, [lastLedger])

    if (isError)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch fee stats</div>
        </div>
    if (!feeStats)
        return <div className="loader"/>

    return <div className="segment blank">
        <h3>Fee Stats <span className="text-small">(last 5 ledgers)</span></h3>
        <table className="table exportable space">
            <thead>
            <tr>
                <th>Metric</th>
                <th className="text-right nowrap">Value</th>
            </tr>
            </thead>
            <tbody className="condensed">
            <tr>
                <td data-header="Metric: ">Capacity Usage</td>
                <td data-header="Value: " className="text-right">{feeStats.ledger_capacity_usage * 100}%</td>
            </tr>
            <MetricEntryView title="Max Accepted Fee" value={fromStroops(feeStats.max_fee.max)}/>
            <MetricEntryView title="Min Accepted Fee" value={fromStroops(feeStats.max_fee.min)}/>
            <MetricEntryView title="Mode Accepted Fee" value={fromStroops(feeStats.max_fee.mode)}/>
            <MetricEntryView title="10th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p10)}/>
            <MetricEntryView title="20th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p20)}/>
            <MetricEntryView title="30th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p30)}/>
            <MetricEntryView title="40th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p40)}/>
            <MetricEntryView title="50th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p50)}/>
            <MetricEntryView title="60th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p60)}/>
            <MetricEntryView title="70th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p70)}/>
            <MetricEntryView title="80th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p80)}/>
            <MetricEntryView title="90th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p90)}/>
            <MetricEntryView title="95th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p95)}/>
            <MetricEntryView title="99th Percentile Accepted Fee" value={fromStroops(feeStats.max_fee.p99)}/>
            </tbody>
        </table>
    </div>
}

function MetricEntryView({title, value}) {
    return <tr>
        <td data-header="Metric: ">{title}</td>
        <td data-header="Value: " className="text-right">
            <Amount amount={value} asset="XLM" issuer={false}/>
        </td>
    </tr>
}