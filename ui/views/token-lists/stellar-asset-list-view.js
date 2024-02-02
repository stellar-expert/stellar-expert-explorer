import React from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {InfoTooltip as Info, AssetLink, withErrorBoundary} from '@stellar-expert/ui-framework'


export default withErrorBoundary(function StellarAssetListView({tokenList}) {

    return <div className="segment blank">
        <h3>Assets list</h3>
        <hr className="flare"/>
        <table className="table space">
            <thead>
                <tr>
                    <th>Address</th>
                    <th>Name</th>
                    <th>Issuer</th>
                    <th className="text-right">Decimals</th>
                </tr>
            </thead>
            <tbody className="condensed">
                {tokenList.assets.map(asset => {
                    const descriptor = asset.issuer ? new AssetDescriptor(asset.code, asset.issuer) : null
                    return <tr key={asset.name + asset.issuer}>
                        <td className="nowrap" data-header="Address: ">
                            <AssetLink asset={descriptor || asset.contract} icon={asset.iconUrl}/>
                        </td>
                        <td data-header="Asset: ">
                            <img src={asset.iconUrl} alt="" style={{height: '1em'}}/>&nbsp;
                            {asset.name}&nbsp;
                            {!!asset.comment && <Info>{asset.comment}</Info>}
                        </td>
                        <td data-header="Issuer: ">
                            <a href={asset.domain} target="_blank" rel="noreferrer">{asset.org}</a>
                        </td>
                        <td className="text-right" data-header="Decimals: ">
                            {asset.decimals}
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </div>
})