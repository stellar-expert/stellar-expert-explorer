import React from 'react'
import {Amount, UpdateHighlighter} from '@stellar-expert/ui-framework'
import {formatWithPrecision} from '@stellar-expert/formatter'
import {useAssetOverallStats} from '../../../business-logic/api/asset-api'
import {use24hLedgerStats} from '../../../business-logic/api/ledger-stats-api'
import TotalXlmIssuedView from './total-xlm-issued-view'

export default function LedgerByNumbersView() {
    const {data: assetStats, loaded: assetStatsLoaded} = useAssetOverallStats()
    const {data: ledgerStats, ledgerStatsLoaded} = use24hLedgerStats()

    if (!assetStatsLoaded && !ledgerStatsLoaded)
        return <div className="loader"/>

    return <div>
        <div className="card card-mobile-margin">
            <h3>DEX Trades <span className="text-small">(last 24H)</span></h3>
            <div className="double-space"/>
            <div><UpdateHighlighter>
                <Amount amount={ledgerStats?.trades || 0}/>
            </UpdateHighlighter></div>
            <div className="space"/>
            <hr className="flare"/>
            <div className="dual-layout">
                <div className="dimmed">Overall</div>
                <div>{formatWithPrecision(assetStats?.trades)}</div>
            </div>
        </div>
        <div className="space"/>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Total Unique Assets</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={assetStats?.total_assets}/></UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Total Accounts</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={ledgerStats?.accounts}/></UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>24H Payments</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={ledgerStats?.payments}/></UpdateHighlighter>
                    </div>
                </div>
            </div>
        </div>
        <div className="space desktop-only"/>
        <TotalXlmIssuedView ledgerStats={ledgerStats}/>
    </div>
}