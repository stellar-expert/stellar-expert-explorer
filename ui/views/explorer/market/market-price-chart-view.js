import React from 'react'
import {useDependantState, loadTradesAggregation} from '@stellar-expert/ui-framework'
import {formatPrice} from '@stellar-expert/formatter'
import Chart from '../../components/chart-view'

function useMarketTrades({selling, buying}) {
    const [trades, setTrades] = useDependantState(()=>{
        loadTradesAggregation({
            resolution: '1d',
            period: '99',
            base: buying,
            counter: selling,
            limit: 100
        })
            .then(({records}) => {
                if (!records || !records.length) return
                const parsed = records.map(({timestamp, base_volume, avg, open, high, low, close}) => ({
                    ts: timestamp,
                    volume: parseFloat(base_volume),
                    price: parseFloat(avg),
                    ohlc: [parseFloat(open), parseFloat(high), parseFloat(low), parseFloat(close)]
                }))
                setTrades({data: parsed, loading: false})
            })
            .catch(e => {
                setTrades({error: true, loading: false})
                console.error(e)
            })
        return {loading: true}
    }, [selling.toString(), buying.toString()])
    return trades
}

export default function MarketPriceChartView({buying, selling, noTitle, currency}) {
    const {loading, error, data} = useMarketTrades({selling, buying})
    if (loading) return <div className="loader"/>
    if (!data.length || error) return null

    const config = {
        tooltip: {
            pointFormatter: function () {
                if (this.open === undefined) return `<span>Volume: <b>${formatPrice(this.y)} ${currency}</b></span><br/>`
                return `<span>Open: <b>${formatPrice(this.open)}</b> ${currency}</span><br/>
<span>High: <b>${formatPrice(this.high)}</b> ${currency}</span><br/>
<span>Low: <b>${formatPrice(this.low)}</b> ${currency}</span><br/>
<span>Close: <b>${formatPrice(this.close)}</b> ${currency}</span><br/>`
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
    /* var data = [];
    data.push(datapoints.lineData[0]);

    datapoints.lineData.forEach((point, i) => {
      if (i > 0) {
        var previousX = datapoints.lineData[i - 1][0],
          distance = point[0] - previousX;
        if (distance === 60000) {
          data.push(datapoints.lineData[i]);
        } else {
          data.push([previousX + 1, null])
          data.push(datapoints.lineData[i]);
        }
      }
    }) */
    const prices = [],
        volumes = [],
        hour = 60 * 60 * 1000
    let prevTs,
        tradesStarted = false
    for (let {ts, ohlc, volume} of data) {
        ts = parseInt(ts)
        if (!tradesStarted) {
            //ignore pre-trading period
            if (volume === 0) continue
            tradesStarted = true
        }
        if (prevTs !== undefined) {
            const span = (ts - prevTs) / hour
            if (span > 1) {
                for (let i = 1; i < span - 1; i++) {
                    prices.push(null)
                    //data.push([prevTs + i * hour])
                }
            }
        }
        prices.push([ts, ...ohlc])
        volumes.push([ts, volume])
    }

    config.series.push({
        type: 'candlestick',
        name: 'Price',
        //maxPointWidth: 12,
        data: prices
    })

    config.series.push({
        type: 'column',
        name: 'Volume',
        yAxis: 1,
        //maxPointWidth: 12,
        data: volumes
    })

    return <Chart type="StockChart" options={config} grouped range noLegend title="Price History"/>
}