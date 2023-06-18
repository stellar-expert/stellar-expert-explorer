import React from 'react'
import cn from 'classnames'

const placeholderBars = [30, 60, 42, 40, 70, 62, 80, 83]

export function ChartLoader({unavailable = false, container}) {
    return <div className={cn('chart', container !== undefined ? container : 'segment blank')}>
        <div className="chart-placeholder">
            {placeholderBars.map(v => <div key={v} style={{height: v + '%'}}/>)}
        </div>
        <div className="v-center-block">
            {unavailable ?
                <div className="text-center dimmed">
                    <span className="icon icon-minus-circle"/> Data unavailable
                </div> :
                <div className="text-center">
                    <div className="loader"/>
                    <div className="text-small dimmed text-center" style={{marginTop: '-2em'}}>Loading chart data...</div>
                </div>}
        </div>
    </div>
}