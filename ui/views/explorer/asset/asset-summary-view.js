import React from 'react'
import {Amount, UtcTimestamp, InfoTooltip as Info, withErrorBoundary, AssetLink, AccountAddress} from '@stellar-expert/ui-framework'
import {formatWithPrecision} from '@stellar-expert/formatter'
import AuthorizationFlags from '../account/account-authorization-flags-view'
import LockStatus from '../account/account-lock-status-view'
import AssetPriceChange from './asset-price-change'

function formatTrustlines({total, authorized, funded}) {
    return <>
        {formatWithPrecision(total || 0, 0)}
        {(authorized > 0 || funded > 0) && <>&nbsp;total</>}
        {/*{authorized > 0 && <> / {formatWithPrecision(authorized||0, 0)}&nbsp;authorized</>}*/}
        {funded > 0 && <> / {formatWithPrecision(funded || 0, 0)}&nbsp;funded</>}
    </>
}

export default withErrorBoundary(function AssetSummaryView({asset}) {
    const {descriptor, issuerInfo} = asset
    return <dl>
        {!!asset.contract && <>
            <dt>Soroban Contract:</dt>
            <dd><AccountAddress account={asset.contract}/></dd>
        </>}
        {!!asset.rating && <>
            <dt>Rating:</dt>
            <dd>{(asset.rating.average || 0).toFixed(1)}
                <Info>Composite rating based on asset age, established trustlines, weekly trading volume,
                    payments and trades count.</Info>
            </dd>
        </>}
        {asset.supply > 0 && <>
            <dt>Total supply:</dt>
            <dd>
                <Amount amount={asset.supply} round asset={descriptor} decimals={asset.decimals} adjust/>
                <Info link="https://www.stellar.org/developers/guides/concepts/assets.html">Total number of
                    asset tokens emitted by the issuing account.</Info>
            </dd>
        </>}
        {asset.fee_pool > 0 && <>
            <dt>Locked in fee pool:</dt>
            <dd>
                <Amount amount={asset.fee_pool} round asset={descriptor} decimals={asset.decimals} adjust/>
                <Info link="https://www.stellar.org/developers/guides/concepts/fees.html#fee-pool">Number of lumens that
                    have been paid in fees. This number is added to the inflation pool and reset to 0 each time
                    inflation runs.</Info>
            </dd>
        </>}
        {asset.reserve > 0 && <>
            <dt>Reserved amount:</dt>
            <dd>
                <Amount amount={asset.reserve} round asset={descriptor} decimals={asset.decimals}
                        adjust/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    inactive lumens (burned, locked in escrow, held on SDF operational accounts, etc.)</Info>
            </dd>
            <dt>Circulating supply:</dt>
            <dd>
                <Amount amount={asset.supply - asset.reserve - asset.fee_pool} round asset={descriptor}
                        decimals={asset.decimals} adjust/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    lumens in circulation.
                </Info>
            </dd>
        </>}
        {asset.created > 0 && <>
            <dt>First transaction:</dt>
            <dd><UtcTimestamp date={asset.created}/>
                <Info>The timestamp of the first asset transaction, referred as "asset birthday".</Info>
            </dd>
        </>}
        <dt>Trustlines:</dt>
        <dd>{formatTrustlines(asset.trustlines)}
            <Info link="https://www.stellar.org/developers/guides/concepts/assets.html#trustlines">Total
                number of accounts that established asset trustlines. Trustlines track the limit for which
                an account trusts the issuing account and the amount of credit from the issuing account
                held.</Info>
        </dd>
        {asset.median_balance > 0 && <>
            <dt>Median balance:</dt>
            <dd><Amount asset={descriptor} amount={asset.median_balance} adjust/>
                <Info>Median asset balance value calculated from all asset holders.</Info>
            </dd>
        </>}
        <dt>Total payments count:</dt>
        <dd>
            {formatWithPrecision(asset.payments || 0, 0)}
            <Info>Total count of all payments with the asset recorded on the ledger.</Info>
        </dd>
        <dt>Overall payments volume:</dt>
        <dd>
            <Amount amount={asset.payments_amount} round asset={descriptor}/>
            <Info>Total amount of payments executed since asset creation.</Info>
        </dd>
        <dt>Total trades count:</dt>
        <dd>
            {formatWithPrecision(asset.trades || 0, 0)}
            <Info>Total count of all trades with the asset recorded on the Stellar ledger.</Info>
        </dd>
        {!!asset.volume && <>
            <dt>Overall traded volume:</dt>
            <dd>
                <Amount amount={asset.volume} round asset="USD"/>
                <Info>Volume of all on-chain trading operations.</Info>
            </dd>
        </>}
        {asset.price > 0 && <>
            <dt>Current price:</dt>
            <dd>
                <AssetPriceChange priceDynamic={asset.price_dynamic} digits={7}/>
                <Info>Current indicative DEX price.</Info>
            </dd>
        </>}
        {!!issuerInfo && <AuthorizationFlags accountInfo={issuerInfo}/>}
        {!!issuerInfo && <LockStatus accountInfo={issuerInfo} forAsset/>}
    </dl>
})