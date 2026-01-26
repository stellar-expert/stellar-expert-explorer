import React from 'react'
import {Amount, UpdateHighlighter} from '@stellar-expert/ui-framework'
import {fromStroops} from '@stellar-expert/formatter'
import TransactionFeeInfoView from './transactions-fee-info-view'

export default function FeeStatsView({lastLedger}) {
    if (!lastLedger)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch fee stats</div>
        </div>

    const capacity = (lastLedger.operations + lastLedger.failedOperations) / 1000

    return <div>
        <div className="segment blank">
            <h3>Fee Stats</h3>
            <table className="table exportable space">
                <thead>
                <tr>
                    <th>Metric</th>
                    <th className="text-right nowrap">Bid Fee</th>
                    <th className="text-right nowrap">Accepted Fee</th>
                </tr>
                </thead>
                <tbody className="condensed">
                <MetricEntryView title="Max Fee" bidsFee={lastLedger.fees.bids.max} chargedFee={lastLedger.fees.charged.max}/>
                <MetricEntryView title="Min Fee" bidsFee={lastLedger.fees.bids.min} chargedFee={lastLedger.fees.charged.min}/>
                <MetricEntryView title="10th Percentile" bidsFee={lastLedger.fees.bids.p10} chargedFee={lastLedger.fees.charged.p10}/>
                <MetricEntryView title="20th Percentile" bidsFee={lastLedger.fees.bids.p20} chargedFee={lastLedger.fees.charged.p20}/>
                <MetricEntryView title="30th Percentile" bidsFee={lastLedger.fees.bids.p30} chargedFee={lastLedger.fees.charged.p30}/>
                <MetricEntryView title="40th Percentile" bidsFee={lastLedger.fees.bids.p40} chargedFee={lastLedger.fees.charged.p40}/>
                <MetricEntryView title="50th Percentile" bidsFee={lastLedger.fees.bids.p50} chargedFee={lastLedger.fees.charged.p50}/>
                <MetricEntryView title="60th Percentile" bidsFee={lastLedger.fees.bids.p60} chargedFee={lastLedger.fees.charged.p60}/>
                <MetricEntryView title="70th Percentile" bidsFee={lastLedger.fees.bids.p70} chargedFee={lastLedger.fees.charged.p70}/>
                <MetricEntryView title="99th Percentile" bidsFee={lastLedger.fees.bids.p80} chargedFee={lastLedger.fees.charged.p80}/>
                <MetricEntryView title="80th Percentile" bidsFee={lastLedger.fees.bids.p90} chargedFee={lastLedger.fees.charged.p90}/>
                <MetricEntryView title="90th Percentile" bidsFee={lastLedger.fees.bids.p95} chargedFee={lastLedger.fees.charged.p95}/>
                <MetricEntryView title="99th Percentile" bidsFee={lastLedger.fees.bids.p99} chargedFee={lastLedger.fees.charged.p99}/>
                </tbody>
            </table>
        </div>
        <div className="space"/>
        <TransactionFeeInfoView lastLedger={lastLedger} capacity={capacity}/>
    </div>
}

function MetricEntryView({title, bidsFee, chargedFee}) {
    return <tr>
        <td data-header="Metric: ">{title}</td>
        <td data-header="Value: " className="text-right">
            <UpdateHighlighter><Amount amount={fromStroops(bidsFee)} asset="XLM" issuer={false}/></UpdateHighlighter>
        </td>
        <td data-header="Value: " className="text-right">
            <UpdateHighlighter><Amount amount={fromStroops(chargedFee)} asset="XLM" issuer={false}/></UpdateHighlighter>
        </td>
    </tr>
}