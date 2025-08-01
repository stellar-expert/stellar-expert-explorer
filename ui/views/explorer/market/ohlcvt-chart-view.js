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
        to = toUnixTimestamp(new Date())
        from = to - 20 * 365 * 24 * 60 * 60 // 20 years
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
        chart.showLoading('...')
        loadCallbackRef.current = function (data) {
            //update chart data on scale-in
            const {prices, volumes} = processData(data)
            chart.series[0].setData(prices)
            chart.series[1].setData(volumes)
            chart.hideLoading()
            loadCallbackRef.current = null
        }
        setFrom(Math.floor(min / 1000 / 3600) * 3600)
        setTo(Math.round(max / 1000))
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
                        e.target.xAxis[0].setExtremes(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
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
            data: prices
        })

        config.series.push({
            type: 'column',
            name: 'Volume',
            yAxis: 1,
            data: volumes
        })

        setConfig(config)
    }, [navigatorData])

    if (!navigatorData)
        return <Chart.Loader title={title}/>
    if (!navigatorData.data.length)
        return <Chart.Loader title={title} unavailable/>

    return <Chart type="StockChart" options={config} range noLegend title={title}/>
})