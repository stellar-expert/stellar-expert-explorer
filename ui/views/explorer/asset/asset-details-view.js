import React from 'react'
import CrawlerScreen from '../../components/crawler-screen'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'
import AssetHeader from './asset-header-view'
import AssetRatingChart from './charts/asset-rating-chart-view'
import AssetStatsHistoryView from './asset-stats-history-view'
import AssetSummaryView from './asset-summary-view'

export default function AssetDetailsView({asset}) {
    if (!asset || asset.loading)
        return <div className="loader"/>
    const {descriptor, rating} = asset
    return <>
        <AssetHeader asset={asset}/>
        <div className="mobile-only space"/>
        <div className="row" style={{marginTop: '-0.3em'}}>
            <div className="space column column-50">
                <div className="segment blank">
                    <h3>Summary<EmbedWidgetTrigger path={`asset/summary/${descriptor.toString()}`} title="Asset Summary"/></h3>
                    <hr className="flare"/>
                    <AssetSummaryView asset={asset}/>
                </div>
                <div className="space mobile-only"/>
            </div>
            {!descriptor.isNative && rating && <div className="space column column-50">
                <AssetRatingChart asset={asset}/>
                <div className="space mobile-only"/>
            </div>}
            <CrawlerScreen>
                <AssetStatsHistoryView asset={asset}/>
            </CrawlerScreen>
        </div>
    </>
}