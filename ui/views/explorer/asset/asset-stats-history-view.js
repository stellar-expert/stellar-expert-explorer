import React from 'react'
import AssetSupplyChart from './charts/asset-supply-chart-view'
import AssetsPriceChart from './charts/asset-price-chart-view'

export default function AssetStatsHistoryView({asset}) {
    if (!asset || asset.loading)
        return null
    return <>
        <div className="space column column-50">
            <AssetSupplyChart asset={asset}/>
            <div className="space mobile-only"/>
        </div>
        {asset.descriptor.type !== 4 && <div className="space column column-50">
            <AssetsPriceChart asset={asset}/>
            <div className="space mobile-only"/>
        </div>}
    </>
}