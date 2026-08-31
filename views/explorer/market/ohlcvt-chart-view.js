import React, {useEffect, useRef, useState, useCallback} from 'react'
import {useExplorerApi} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, formatPrice, toUnixTimestamp} from '@stellar-expert/formatter'
import Chart from '../../components/chart/chart'

/**
 * Retrieve chart series points from candles data
 * @param {[]} data
 * @return {{volumes: [], prices: []}}
 */
function processData(data) {
    const prices = []
    const volumes = []
    for (const record of data) {
        const ts = record[0] * 1000
        prices.push([ts, ...record.slice(1, 5)])
        volumes.push([ts, parseFloat(formatWithAutoPrecision(record[6] / 10000000, ''))])
    }
    prices.push([new Date().getTime(), null, null, null, null])
    return {prices, volumes}
}

/**
 * Format API URL
 * @param {String} baseEndpoint
 * @param {Number} from
 * @param {Number} to
 * @return {String}
 */
function buildUrl(baseEndpoint, from, to) {
    let endpoint = `${baseEndpoint}/candles`
    const queryParams = []
    if (!from && !to) {
        to = trimTimestamp5m(new Date().getTime() + 5 * 60 * 1000) / 1000
        from = to - 10 * 365 * 24 * 60 * 60 // 10 years
    }
    if (from) {
        queryParams.push('from=' + from)
    }
    if (to) {
        queryParams.push('to=' + to)
    }
    if (queryParams.length) {
        endpoint += '?' + queryParams.join('&')
    }
    return endpoint
}

//finer bucket ladder than the explorer-wide default (which starts at whole days) — intraday candles
//for short windows (e.g. 12h candles on the 1m view) and single-day candles as long as they fit
//(e.g. the 6m view), falling back to weeks/months only for multi-year ranges. ~10px per candle.
const candleDataGrouping = {
    units: [
        ['hour', [1, 2, 3, 4, 6, 8, 12]],
        ['day', [1]],
        ['week', [1]],
        ['month', [1, 3, 6]]
    ],
    groupPixelWidth: 10
}

function trimTimestamp5m(ts) {
    if (ts instanceof Date) {
        ts = ts.getTime()
    }
    const minTimeFrame = 5 * 60 * 1000
    return Math.floor(ts / minTimeFrame) * minTimeFrame
}

export default Chart.withErrorBoundary(function OhlcvtChartView({baseEndpoint, title, currency}) {
    const [from, setFrom] = useState(0)
    const [to, setTo] = useState(0)
    const [config, setConfig] = useState(null)
    const [navigatorData, setNavigatorData] = useState(null)
    const loadCallbackRef = useRef()
    const {data, loaded} = useExplorerApi(buildUrl(baseEndpoint, from, to))

    if (loaded && data instanceof Array) {
        //set navigator data for the entire market lifespan
        if (!navigatorData || navigatorData.baseEndpoint !== baseEndpoint) {
            setNavigatorData({baseEndpoint, data})
        }
        //update sub-period chart data if the recent update has been invoked by chart
        if (loadCallbackRef.current) {
            loadCallbackRef.current(data)
        }
    }

    const loadScaledData = useCallback(function loadScaledData(chart, min, max) {
        if (loadCallbackRef.current)
            return
        chart.showLoading()
        loadCallbackRef.current = function (data) {
            //update chart data on scale-in
            const {prices, volumes} = processData(data)
            chart.series[0].setData(prices)
            chart.series[1].setData(volumes)
            chart.hideLoading()
            loadCallbackRef.current = null
        }
        const from = trimTimestamp5m(min) / 1000
        const to = trimTimestamp5m(max) / 1000
        setFrom(from)
        setTo(to)
    }, [])


    useEffect(() => {
        //reset navigator data on pair change
        loadCallbackRef.current = null
        setNavigatorData(null)
        setFrom(0)
        setTo(0)
    }, [baseEndpoint, currency])

    useEffect(() => {
        if (!navigatorData)
            return

        const {prices, volumes} = processData(navigatorData.data)

        const config = {
            chart: {
                events: {
                    load(e) {
                        e.target.xAxis[0].setExtremes(trimTimestamp5m(new Date()) - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            tooltip: {
                pointFormatter() {
                    if (this.open === undefined)
                        return `<span class="dimmed">Volume: </span><b>${formatWithAutoPrecision(this.y)} ${currency}</b><br/>`
                    return `<span class="dimmed">Open: </span><b>${formatPrice(this.open)} ${currency}</b><br/>
<span class="dimmed">High: </span><b>${formatPrice(this.high)} ${currency}</b><br/>
<span class="dimmed">Low: </span><b>${formatPrice(this.low)} ${currency}</b><br/>
<span class="dimmed">Close: </span><b>${formatPrice(this.close)} ${currency}</b><br/>`
                }
            },
            navigator: {
                enabled: true,
                adaptToUpdatedData: false,
                series: {
                    data: prices
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
            xAxis: {
                minRange: 3600 * 1000,
                range: 30 * 24 * 60 * 60 * 1000,
                events: {
                    afterSetExtremes: e => loadScaledData(e.target.chart, e.min, e.max)
                }
            },
            series: []
        }


        config.series.push({
            type: 'candlestick',
            name: 'Price',
            data: prices,
            dataGrouping: candleDataGrouping
        })

        config.series.push({
            type: 'column',
            name: 'Volume',
            colorIndex: 0,
            yAxis: 1,
            data: volumes,
            //same buckets as the price series so volume bars stay aligned with the candles
            dataGrouping: candleDataGrouping
        })

        setConfig(config)
    }, [navigatorData])

    if (!navigatorData)
        return <Chart.Loader title={title}/>
    if (!navigatorData.data.length)
        return <Chart.Loader title={title} unavailable/>

    return <Chart type="StockChart" options={config} range grouped noLegend title={title}/>
})