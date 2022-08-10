import React from 'react'
import OhlcvtChartView from './ohlcvt-chart-view'

export default function MarketPriceChartView({buying, selling, currency}) {
    return <OhlcvtChartView baseEndpoint={`market/${selling.toString()}/${buying.toString()}`}
                            title="Price History" currency={currency}/>
}