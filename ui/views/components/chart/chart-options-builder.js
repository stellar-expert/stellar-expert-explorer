import deepMerge from 'deepmerge'
import {Highcharts} from './chart-default-options'

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
    buttonTheme: { //button styles
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

const groupingUnits = [
    ['day', [1, 3]],
    ['week', [1, 2]],
    ['month', [1, 2, 6]]
]

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

const activeModules = new Set()

function extendWithModules(modules) {
    if (!modules)
        return
    for (const module of modules)
        if (!activeModules.has(module)) {
            module(Highcharts)
            activeModules.add(module)
        }
}

export function prepareChartOptions(externalOptions, {modules, noLegend, grouped, range}) {
    //extend Highcharts with modules
    extendWithModules(modules)
    const extraOptions = {}
    //enable/disable legend block
    extraOptions.legend = {enabled: !noLegend}
    //set plot options with specific settings for grouping
    if (grouped) {
        extraOptions.plotOptions = groupedPlotOptions
    }
    //configure range navigation settings
    if (range) {
        extraOptions.rangeSelector = rangeSelectorOptions
        if (typeof range === 'string') {
            const now = new Date()
            const period = new Date(now.valueOf())
            switch (range) {
                case 'year':
                    period.setUTCFullYear(period.getUTCFullYear() - 1)
                    extraOptions.xAxis = {range: now - period}
                    break
                case 'month':
                    period.setUTCMonth(period.getUTCMonth() - 1)
                    extraOptions.xAxis = {range: now - period}
                    break
                default:
                    throw new TypeError('Invalid date range for a chart: ' + range)
            }
        }
    }
    return deepMerge.all([externalOptions, extraOptions])
}

