import Highcharts from '../../../vendor/highcharts-minimal'

//allow negative values on the logarithmic axis
Highcharts.Axis.prototype.allowNegativeLog = true

//override conversions
Highcharts.Axis.prototype.log2lin = function (num) {
    let adjustedNum = Math.abs(num)
    if (adjustedNum < 10) {
        adjustedNum += (10 - adjustedNum) / 10
    }
    const result = Math.log(adjustedNum) / Math.LN10
    return num < 0 ? -result : result
}
Highcharts.Axis.prototype.lin2log = function (num) {
    let result = Math.pow(10, Math.abs(num))
    if (result < 10) {
        result = (10 * (result - 1)) / (10 - 1)
    }
    return num < 0 ? -result : result
}

const defaultTextStyle = {
    fontSize: '12px',
    fontFamily: 'Roboto Condensed,sans-serif',
    fontWeight: 400,
    color: 'var(--color-text)'
}

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
        style: {...defaultTextStyle, fontSize: '17px'}
    },
    chart: {
        backgroundColor: null,
        zoomType: 'x',
        spacing: [2, 2, 2, 2],
        style: {
            fontFamily: 'sans-serif'
        }
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
    navigator: {
        enabled: false
    },
    credits: {
        enabled: false
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
    //general
    background2: '#F0F0EA',
    lang: {
        decimalPoint: '.',
        thousandsSep: ','
    }
}

//apply the theme
Highcharts.setOptions(theme)

export {Highcharts}
