import React from 'react'
import OhlcvtChartView from '../../market/ohlcvt-chart-view'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'

export default function AssetPriceChartView({asset, noTitle}) {
    const title = !noTitle && <>
        Price History
        <EmbedWidgetTrigger path={`asset/price/${asset.descriptor.toString()}`} title="Asset Price and Volume"/>
    </>
    return <OhlcvtChartView baseEndpoint={`asset/${asset.descriptor.toString()}`} currency="USD" title={title}/>
}