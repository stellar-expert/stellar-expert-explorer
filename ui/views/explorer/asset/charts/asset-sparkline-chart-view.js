import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import Chart from '../../../components/chart/chart'

const defaultOptions = {
    chart: {
        //renderTo: (options.chart && options.chart.renderTo) || this,
        backgroundColor: null,
        borderWidth: 0,
        type: 'spline',
        margin: [0, 0, 0, 0],
        width: 80,
        height: 24,
        style: {
            overflow: 'visible'
        },
        // small optimization, saves 1-2 ms each sparkline
        skipClone: true
    },
    credits: {
        enabled: false
    },
    xAxis: {
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        crosshair: false,
        startOnTick: false,
        endOnTick: false,
        lineWidth: 0,
        tickPositions: []
    },
    yAxis: {
        endOnTick: false,
        startOnTick: false,
        gridLineColor: 'transparent',
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        tickPositions: []
    },
    tooltip: {
        //useHTML: true,
        outside: true,
        borderWidth: 1,
        hideDelay: 0,
        shared: true,
        padding: 4,
        formatter () {
            return `<span style="font-size: 10px;white-space: nowrap">${formatWithAutoPrecision(this.y)} ${this.points[0].series.name}</span>`
        }
    },
    plotOptions: {
        series: {
            animation: false,
            lineWidth: 2,
            shadow: false,
            connectNulls: true,
            states: {
                hover: {
                    lineWidth: 2.4
                }
            },
            marker: {
                radius: 0,
                states: {
                    hover: {
                        radius: 2
                    }
                }
            },
            fillOpacity: 0.25
        }
    }
}

function getSparkLineConfig(currency, sparklineData) {
    if (sparklineData.every(([t, price]) => price === 0)) {
        //no trades - render empty chart
        sparklineData = []
    }
    return {
        series: [{
            type: 'spline',
            colorIndex: 1,
            name: currency,
            data: sparklineData
        }],
        ...defaultOptions
    }
}

export default function SparkLineChart({currency, sparklineData}) {
    return <Chart title="" inline options={getSparkLineConfig(currency, sparklineData)} noLegend
                  style={{margin: '-4px -4px', verticalAlign: 'middle'}}/>
}

