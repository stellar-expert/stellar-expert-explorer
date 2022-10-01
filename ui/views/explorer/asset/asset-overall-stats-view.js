import React from 'react'
import {Amount, InfoTooltip as Info, useExplorerApi} from '@stellar-expert/ui-framework'
import {formatWithPrecision} from '@stellar-expert/formatter'
import {useAssetOverallStats} from '../../../business-logic/api/asset-api'
import {use24hLedgerStats} from '../../../business-logic/api/ledger-stats-api'

export default function AssetsOverallStatsView() {
    const {data: assetStats, loaded: assetStatsLoaded} = useAssetOverallStats(),
        {data: ledgerStats, loaded: ledgerStatsLoaded} = use24hLedgerStats()
    const xlmStats = useExplorerApi('asset/XLM?history=false', {ttl: 60})
    return <dl>
        {assetStatsLoaded ? <>
            <dt>Unique assets:</dt>
            <dd>
                {formatWithPrecision(assetStats.total_assets)}
                <Info>Total number of assets that exist on the ledger.</Info>
            </dd>
            <dt>Overall payments:</dt>
            <dd>
                {formatWithPrecision(assetStats.payments)}
                <Info>Total number of all asset payments.</Info>
            </dd>
            <dt>Overall DEX trades:</dt>
            <dd>
                {formatWithPrecision(assetStats.trades)}
                <Info>Total number of all on-chain trades.</Info>
            </dd>
            <dt>Overall DEX volume:</dt>
            <dd>
                <Amount amount={assetStats.volume} asset="XLM" adjust round/>
                <Info>Total volume of all on-chain trades in XLM.</Info>
            </dd>
        </> : <div className="loader"/>
        }
        {ledgerStatsLoaded ? <>
            <dt>XLM in circulation:</dt>
            <dd>
                <Amount
                    amount={parseFloat(ledgerStats.total_xlm) - parseFloat(ledgerStats.reserve) - parseFloat(ledgerStats.fee_pool)}
                    asset="XLM" round adjust/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    lumens in circulation.
                </Info>
            </dd>
            <dt>XLM reserved:</dt>
            <dd>
                <Amount amount={ledgerStats.reserve} asset="XLM" round adjust/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    inactive lumens (burned, locked in escrow, held on SDF operational accounts, etc.)</Info>
            </dd>
            <dt>XLM fee pool:</dt>
            <dd>
                <Amount amount={ledgerStats.fee_pool} asset="XLM" round adjust/>
                <Info link="https://www.stellar.org/developers/guides/concepts/fees.html#fee-pool">Number of lumens that
                    have been paid in fees. This number is added to the inflation pool and reset to 0 each time
                    inflation runs (currently disabled).</Info>
            </dd>
        </> : <div className="loader"/>}
    </dl>
}