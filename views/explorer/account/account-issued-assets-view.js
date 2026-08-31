import React, {useState} from 'react'
import {AssetLink, InfoTooltip as Info, withErrorBoundary} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {useAccountIssuedAssets} from '../../../business-logic/api/account-api'

export default withErrorBoundary(function AccountIssuedAssetsView({address}) {
    const [expanded, setExpanded] = useState(false),
        {data: issuedAssets, loaded} = useAccountIssuedAssets(address)

    if (!loaded || !issuedAssets.length) return null

    function renderAsset(asset) {
        return <li key={asset.asset_code}>
            <AssetLink asset={`${asset.asset_code}-${asset.asset_issuer}`} issuer={false}/>
            &nbsp;<span className="dimmed">({formatWithAutoPrecision(asset.num_accounts)} trustlines)</span>
        </li>
    }

    const withTrustlines = [],
        empty = []

    for (const asset of issuedAssets) {
        (asset.num_accounts > 0 && asset.amount > 0 ? withTrustlines : empty).push(asset)
    }

    return <div className="account-issued-assets">
        <h4 style={{marginBottom: 0}}>Assets Issued by this Account
            <Info link="https://www.stellar.org/developers/guides/concepts/assets.html">An account can issue custom
                Stellar assets. Any asset on the network can be traded and exchanged with any other.</Info>
        </h4>
        <div className="text-small">
            <ul>
                {withTrustlines.map(asset => renderAsset(asset))}
            </ul>
            {empty.length > 0 && <>
                <a href="#" onClick={e => setExpanded(!expanded)} className="dimmed">
                    <span style={{borderBottom: '1px dotted'}}>
                    {expanded ? 'Hide' : 'Show'} assets with zero supply
                    </span>
                    <i className={`icon angle double ${expanded ? 'up' : 'down'} vtop`}/></a>
                <ul>
                    {expanded && empty.map(asset => renderAsset(asset))}
                </ul>
            </>}
        </div>
    </div>
})