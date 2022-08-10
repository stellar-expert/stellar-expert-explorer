import React from 'react'
import AssetSupplyChart from './charts/asset-supply-chart-view'
import AssetsPriceChart from './charts/asset-price-chart-view'

export default function AssetStatsHistoryView({asset}) {
    if (!asset || asset.loading) return <div className="loader"/>
    const isXlm = asset.descriptor.isNative
    return <>
        <div className="space column column-50">
            <div className="card">
                <AssetSupplyChart asset={asset}/>
            </div>
        </div>
        <div className="space column column-50">
            <div className="card">
                <AssetsPriceChart asset={asset}/>
            </div>
        </div>
    </>
}