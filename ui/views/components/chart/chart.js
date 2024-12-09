import React, {useCallback, useRef} from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import {useDeepEffect} from '@stellar-expert/ui-framework'
import {Highcharts} from './chart-default-options'
import {prepareChartOptions} from './chart-options-builder'
import {withChartErrorBoundary} from './chart-error-boundary'
import {ChartLoader} from './chart-loader'
import './chart.scss'

export {Highcharts, ChartLoader, withChartErrorBoundary}

/**
 * Standard charting component
 * @param {{}} options - Data and options
 * @param {'Chart'|'StockChart'} [type] - Chart type
 * @param {String|JSX.Element} [title] - Chart title
 * @param {Boolean} [inline] - Whether to render the chart as inline-block (for sparkline charts)
 * @param {Boolean} [grouped] - Whether to apply data grouping
 * @param {true|false|'year'|'month'} [range] - Date range
 * @param {Boolean} [noLegend] - Hide the legend section
 * @param {String} [container] - Container class
 * @param {String} [className] - Additional CSS classes
 * @param {{}} [style] - Additional CSS styles
 * @param {Function[]} [modules] - Additional modules
 * @param {*} [children] - Optional children components that will be added to the header
 * @constructor
 */
export default function Chart({
                                  options,
                                  type = 'Chart',
                                  title,
                                  inline,
                                  grouped,
                                  range,
                                  noLegend,
                                  container = 'segment blank',
                                  className,
                                  style,
                                  modules,
                                  children
                              }) {
    const chart = useRef(null)
    const chartIdRef = useRef(`chart${Math.random() * 0x10000000000000}`)
    const destroyChart = useCallback(function () {
        if (chart.current) {
            chart.current.destroy()
            chart.current = null
        }
    }, [chartIdRef.current])

    useDeepEffect(() => {
        destroyChart()
        if (!options)
            return

        const mergedOptions = prepareChartOptions(options, {grouped, range, noLegend, modules})

        chart.current = new Highcharts[type](chartIdRef.current, mergedOptions)

        return destroyChart
    }, [options, modules, type, inline, title])


    if (!options)
        return <ChartLoader title={title}/>
    const containerStyle = {...style}
    if (inline) {
        containerStyle.display = 'inline-block'
        return <div id={chartIdRef.current} style={containerStyle}/>
    }
    return <div className={cn('chart', container, className)} style={containerStyle}>
        {!!title && <h3>{title}</h3>}
        {children}
        <hr className="flare"/>
        <div className="v-center-block">
            <div id={chartIdRef.current}/>
        </div>
    </div>
}

Chart.propTypes = {
    options: PropTypes.object,
    type: PropTypes.oneOf(['StockChart', 'Chart']),
    title: PropTypes.any,
    noLegend: PropTypes.bool,
    grouped: PropTypes.bool,
    range: PropTypes.oneOf([true, false, 'year', 'month']),
    inline: PropTypes.bool,
    container: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    modules: PropTypes.arrayOf(PropTypes.func)
}

Chart.Loader = ChartLoader
Chart.withErrorBoundary = withChartErrorBoundary