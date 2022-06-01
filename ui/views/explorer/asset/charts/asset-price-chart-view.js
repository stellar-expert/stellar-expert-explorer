import React from 'react'
import {formatPrice} from '@stellar-expert/formatter'
import Chart from '../../../components/chart-view'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useAssetHistory} from '../../../../business-logic/api/asset-api'

export default function AssetPriceChartView({asset, noTitle}) {
    const {data, loaded} = useAssetHistory(asset.descriptor)
    if (!loaded || !data.history.length) return null
    const config = {
        tooltip: {
            pointFormatter: function () {
                if (this.open === undefined) return `<span>Volume: <b>${formatPrice(this.y)}</b> USD</span><br/>`
                return `<span>Open: <b>${formatPrice(this.open)}</b> USD</span><br/>
<span>High: <b>${formatPrice(this.high)}</b> USD</span><br/>
<span>Low: <b>${formatPrice(this.low)}</b> USD</span><br/>
<span>Close: <b>${formatPrice(this.close)}</b> USD</span><br/>`
            }
        },
        yAxis: [{
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: ''
            },
            floor: 0,
            height: '82%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: ''
            },
            //softMin: 0,
            top: '85%',
            height: '15%',
            offset: 0,
            lineWidth: 2
        }],
        series: []
    }

    const ohlc = [],
        volumes = [],
        hour = 60 * 60 * 1000
    let prevTs,
        tradesStarted = false
    for (let {ts, price, volume} of data.history) {
        if (!price) continue
        if (!tradesStarted) {
            //ignore pre-trading period
            if (volume === 0) continue
            tradesStarted = true
        }
        if (prevTs !== undefined) {
            const span = (ts - prevTs) / hour
            if (span > 1) {
                for (let i = 1; i < span - 1; i++) {
                    ohlc.push(null)
                    //data.push([prevTs + i * hour])
                }
            }
        }
        const [open, high, low, close] = price

        ohlc.push([ts, open, high, low, close])
        volumes.push([ts, volume])
    }

    if (!ohlc.length) return <>
        {!noTitle && <>
            <h3>
                Price History
                <EmbedWidgetTrigger path={`asset/price/${asset.descriptor.toString()}`} title="Asset Price and Volume"/>
            </h3>
            <hr/>
        </>}
        <div className="dimmed space">
            No trades so far
        </div>
    </>

    config.series.push({
        type: 'candlestick',
        name: 'Price',
        //maxPointWidth: 12,
        data: ohlc
    })

    config.series.push({
        type: 'column',
        name: 'Volume',
        yAxis: 1,
        //maxPointWidth: 12,
        data: volumes
    })

    return <Chart type="StockChart" options={config} grouped range="year" noLegend title={
        !noTitle && <>
            Price History
            <EmbedWidgetTrigger path={`asset/price/${asset.descriptor.toString()}`} title="Asset Price and Volume"/>
        </>
    }/>
}