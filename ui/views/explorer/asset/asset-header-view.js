import React from 'react'
import {AccountAddress, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import AssetVerificationStatusView from './asset-verification-status-view'

export default function AssetHeaderView({asset, subtitle}) {
    const {descriptor} = asset
    return <>
        <h2>
            <span className="dimmed">Asset {subtitle}{' '}</span>
            {descriptor.isNative ? 'XLM - Stellar Lumens' : descriptor.toCurrency()}{' '}
            <span style={{fontSize: '0.7em', margin: 0}}>
                <AssetVerificationStatusView asset={asset}/>
            </span>
        </h2>
        {!!descriptor.issuer && <div className="text-small" style={{margin: '-0.8em 0'}}>
            Issued by <AccountAddress account={descriptor.issuer} chars={12}/>
            <Info link="https://www.stellar.org/developers/guides/concepts/assets.html#anchors-issuing-assets">
                The issuing account from which the asset is issued. Assets are uniquely identified by the asset code and
                the issuer.
            </Info>
        </div>}
    </>
}