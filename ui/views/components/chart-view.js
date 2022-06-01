import React, {useRef} from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import deepMerge from 'deepmerge'
import {useDeepEffect} from '@stellar-expert/ui-framework'
import Highcharts from '../../vendor/highcharts-minimal'

//allow negative values on the logarithmic axis
(function (H) {
    // Pass error messages
    H.Axis.prototype.allowNegativeLog = true

    // Override conversions
    H.Axis.prototype.log2lin = function (num) {
        let isNegative = num < 0,
            adjustedNum = Math.abs(num),
            result
        if (adjustedNum < 10) {
            adjustedNum += (10 - adjustedNum) / 10
        }
        result = Math.log(adjustedNum) / Math.LN10
        return isNegative ? -result : result
    }
    H.Axis.prototype.lin2log = function (num) {
        let isNegative = num < 0,
            absNum = Math.abs(num),
            result = Math.pow(10, absNum)
        if (result < 10) {
            result = (10 * (result - 1)) / (10 - 1)
        }
        return isNegative ? -result : result
    }
}(Highcharts))

const defaultTextStyle = {
    fontSize: '12px',
    fontFamily: 'Roboto Condensed,sans-serif',
    fontWeight: 400,
    color: 'var(--color-text)'
}

const groupingUnits = [
    ['day', [1, 3]],
    ['week', [1, 2]],
    ['month', [1, 2, 6]]
]

const primaryColor = '#08B5E5'

const theme = Highcharts.theme = {
    colors: ['hsl(193,93%,46%)', 'hsl(27,93%,66%)', 'hsl(130,60%,46%)', 'hsl(290,40%,46%)',
        'hsl(180,93%,46%)', 'hsl(13,40%,46%)', 'hsl(115,40%,46%)', 'hsl(270,40%,66%)',
        'hsl(155,60%,46%)', 'hsl(0,40%,66%)', 'hsl(100,43%,66%)', 'hsl(250,50%,66%)',
        'hsl(143,40%,66%)', 'hsl(340,40%,46%)', 'hsl(212,40%,46%)', 'hsl(235,40%,46%)',
        'hsl(135,60%,40%)', 'hsl(320,50%,66%)'
    ],
    title: {
        text: '',
        style: Object.assign({}, defaultTextStyle, {fontSize: '17px'})
    },
    chart: {
        backgroundColor: null,
        spacing: [0, 0, 0, 0]
    },
    scrollbar: {
        enabled: false
    },
    tooltip: {
        shared: true,
        split: false,
        borderWidth: 0,
        /*dateTimeLabelFormats: {
            day: '%b %e, %Y',
            hour: '%b %e, %H:%M',
            minute: '%b %e, %H:%M',
            second: '%b %e, %H:%M:%S',
            millisecond: '%b %e, %H:%M:%S.%L',
            week: 'Week from %b %e, %Y',
            month: '%B %Y',
            year: '%Y'
        },*/
        headerFormat: '<span>{point.key}</span><br/>',
        shadow: false
    },
    legend: {
        itemStyle: defaultTextStyle,
        itemHoverStyle: {color: 'var(--color-highlight)'},
        itemDisabledStyle: {color: 'var(--color-dimmed)'}
    },
    navigation: {
        buttonOptions: {
            symbolFill: 'var(--color-border-shadow)'
        }
    },
    xAxis: {
        type: 'datetime',
        crosshair: true,
        ordinal: false,
        minPadding: 0,
        maxPadding: 0,
        gridLineWidth: 1,
        lineColor: 'var(--color-border-shadow)',
        gridLineColor: 'var(--color-border-shadow)',
        minorGridLineColor: 'var(--color-border-shadow)',
        minorTickColor: 'var(--color-border-shadow)',
        tickColor: 'var(--color-border-shadow)',
        title: {
            style: defaultTextStyle,
            margin: 4
        },
        labels: {
            style: defaultTextStyle
        }
    },
    yAxis: {
        minorTickInterval: 'auto',
        lineColor: 'var(--color-border-shadow)',
        gridLineColor: 'var(--color-border-shadow)',
        minorGridLineColor: 'var(--color-border-shadow)',
        minorTickColor: 'var(--color-border-shadow)',
        tickColor: 'var(--color-border-shadow)',
        title: {
            style: defaultTextStyle
        },
        labels: {
            style: defaultTextStyle
        }
    },
    plotOptions: {
        candlestick: {
            upColor: 'var(--color-price-up)',
            color: 'var(--color-price-down)',
            lineColor: 'var(--color-dimmed)',
            lineWidth: 0.6
        },
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.Color(primaryColor).setOpacity(0.8).get('rgba')],
                    [1, Highcharts.Color(primaryColor).setOpacity(0).get('rgba')]
                ]
            },
            lineWidth: 2,
            states: {
                hover: {
                    lineWidth: 2
                }
            }
        },
        series: {
            pointPadding: 0.1,
            groupPadding: 0.1
        }
    },
    time: {
        useUTC: true
    },
    // General
    background2: '#F0F0EA',
    lang: {
        decimalPoint: '.',
        thousandsSep: ','
    }
}

// Apply the theme
Highcharts.setOptions(theme)

export {Highcharts}

const defaultOptions = {
    chart: {
        zoomType: 'x',
        spacing: [8, 8, 10, 8],
        style: {
            fontFamily: 'sans-serif'
        }
    },
    navigator: {
        enabled: false
    },
    credits: {
        enabled: false
    }
}

const rangeSelectorOptions = {
    inputEnabled: false,
    floating: true,
    buttons: [{
        type: 'month',
        count: 1,
        text: '1m'
    }, {
        type: 'month',
        count: 3,
        text: '3m'
    }, {
        type: 'month',
        count: 6,
        text: '6m'
    }, {
        type: 'year',
        count: 1,
        text: '1y'
    }, {
        type: 'all',
        text: 'All'
    }],
    buttonTheme: { // styles for the buttons
        fill: 'var(--color-border-shadow)',
        stroke: 'var(--color-contrast-border)',
        r: 3,
        style: {
            color: 'var(--color-text)'
        },
        states: {
            hover: {
                fill: 'var(--color-contrast-border)'
            },
            select: {
                fill: 'var(--color-contrast-border)',
                style: {
                    color: 'var(--color-text)'
                }
            },
            disabled: {
                style: {
                    color: 'var(--color-dimmed)'
                }
            }
        }
    }
}

const groupedPlotOptions = {
    series: {
        dataGrouping: {
            units: groupingUnits,
            /*dateTimeLabelFormats: {
                millisecond: ['%b %e, %H:%M:%S.%L', '%b %e, %H:%M:%S.%L', '-%H:%M:%S.%L'],
                second: ['%b %e, %H:%M:%S', '%b %e, %H:%M:%S', '-%H:%M:%S'],
                minute: ['%b %e, %H:%M', '%b %e, %H:%M', '-%H:%M'],
                hour: ['%b %e, %H:%M', '%b %e, %H:%M', '-%H:%M'],
                day: ['%b %e, %Y', '%b %e', '-%b %e, %Y'],
                week: ['Week from %b %e, %Y', '%b %e', 'Week from -%b %e, %Y'],
                month: ['%B %Y', '%B', '-%B %Y'],
                year: ['%Y', '%Y', '-%Y']
            },*/
            groupPixelWidth: 16
        }
    }
}

export default function ChartView({
                                      type,
                                      options,
                                      modules,
                                      title,
                                      noLoader,
                                      className,
                                      inline,
                                      style,
                                      children,
                                      grouped,
                                      range,
                                      noLegend
                                  }) {
    const chartIdRef = useRef(`chart${Math.random() * 0x10000000000000}`),
        chart = useRef(null)

    function destroyChart() {
        if (chart.current) {
            chart.current.destroy()
            chart.current = null
        }
    }

    useDeepEffect(() => {
        destroyChart()
        if (!options) return

        // Extend Highcharts with modules
        if (modules) {
            for (const module of modules) {
                module(Highcharts)
            }
        }

        const extraOptions = {}

        extraOptions.legend = {enabled: !noLegend}

        if (grouped) {
            extraOptions.plotOptions = groupedPlotOptions
        }
        if (range) {
            extraOptions.rangeSelector = rangeSelectorOptions
            if (typeof range === 'string') {
                const now = new Date(),
                    period = new Date(now.valueOf())
                switch (range) {
                    case 'year':
                        period.setUTCFullYear(period.getUTCFullYear() - 1)
                        extraOptions.xAxis = {range: now - period}
                        break
                    case 'month':
                        period.setUTCMonth(period.getUTCMonth() - 1)
                        extraOptions.xAxis = {range: now - period}
                        break
                }
            }
        }
        const mergedOptions = deepMerge.all([defaultOptions, options, extraOptions])

        chart.current = new Highcharts[type || 'Chart'](chartIdRef.current, mergedOptions)

        return destroyChart
    }, [options, modules, type, inline, title])


    if (!options) {
        if (noLoader) return null
        return <div className="loader"/>
    }
    const containerStyle = Object.assign({}, style)
    if (inline) {
        containerStyle.display = 'inline-block'
    }
    return <div className={cn('chart', className)} style={containerStyle}>
        {!!title && <h3 className="text-center">{title}</h3>}
        {children}
        <div id={chartIdRef.current}/>
    </div>
}

ChartView.propTypes = {
    type: PropTypes.oneOf(['StockChart', 'Chart']),
    title: PropTypes.any,
    className: PropTypes.string,
    noLoader: PropTypes.bool,
    options: PropTypes.object,
    noPadding: PropTypes.bool,
    grouped: PropTypes.bool,
    range: PropTypes.oneOf([true, false, 'year', 'month']),
    inline: PropTypes.bool,
    style: PropTypes.object,
    noLegend: PropTypes.bool
}