import React from 'react'
import {Amount} from '@stellar-expert/ui-framework'
import {use24hLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import Chart from '../../components/chart/chart'

export default Chart.withErrorBoundary(function TotalXlmIssuedView() {
    const {data: ledgerStats} = use24hLedgerStats()
    if (!ledgerStats)
        return <div className="loader"/>
    if (ledgerStats.error)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch ledger statistics</div>
        </div>
    const totalSupply = parseFloat(ledgerStats.total_xlm)
    const circulatingSupply = totalSupply - parseFloat(ledgerStats.reserve) - parseFloat(ledgerStats.fee_pool)
    const nonCirculatingSupply = totalSupply - circulatingSupply

    const options = {
        chart: {
            type: 'pie',
            height: 200
        },
        plotOptions: {
            pie: {
                shadow: false
            }
        },
        tooltip: {
            formatter: function () {
                return this.point.name + ' <strong>' + this.y + '%</strong>'
            }
        },
        series: [{
            data: [
                ["Circulating Supply", parseFloat((100 * circulatingSupply / totalSupply).toFixed(2))],
                ["Non-Circulating Supply", parseFloat((100 * nonCirculatingSupply / totalSupply).toFixed(2))]
            ],
            size: '100%',
            innerSize: '80%',
            showInLegend: true,
            dataLabels: {
                enabled: false
            }
        }]
    }

    return <div className="segment blank">
        <h3>Total XLM Issued</h3>
        <hr className="flare"/>
        <div className="row">
            <div className="column column-33">
                <Chart options={options} container="no-flare" className="small"/>
            </div>
            <div className="column column-66">
                <div className="space"/>
                <dl>
                    <dt>Circulating Supply:</dt>
                    <dd><Amount amount={circulatingSupply} asset="XLM" round adjust issuer={false}/></dd>
                    <div className="micro-space desktop-only"/>
                    <dt>Non-Circulating Supply:</dt>
                    <dd><Amount amount={nonCirculatingSupply} asset="XLM" round adjust issuer={false}/></dd>
                    <div className="micro-space desktop-only"/>
                    <dt>Total XLM Supply:</dt>
                    <dd><Amount amount={totalSupply} asset="XLM" round adjust issuer={false}/></dd>
                </dl>
            </div>
        </div>
    </div>
})