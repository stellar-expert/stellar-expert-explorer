import React from 'react'
import cn from 'classnames'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'

/**
 * Charged photons and request counters for the last day and month
 * @param {{day: {}, month: {}}} [summary]
 * @return {JSX.Element}
 */
export default function StatisticsView({summary}) {
    const {day, month} = summary || {}

    return <div className="panel-grid">
        <EntryStatisticView title="24H PHOTONS" value={day?.credits} changes={day?.creditsChange}/>
        <EntryStatisticView title="MONTHLY PHOTONS" value={month?.credits} changes={month?.creditsChange}/>
        <EntryStatisticView title="24H REQUESTS" value={day?.requests} changes={day?.requestsChange}/>
        <EntryStatisticView title="MONTHLY REQUESTS" value={month?.requests} changes={month?.requestsChange}/>
    </div>
}

/**
 * @param {String} title
 * @param {Number} [value]
 * @param {Number} [changes] - percent difference against the previous period
 * @return {JSX.Element}
 */
function EntryStatisticView({title, value = 0, changes = 0}) {
    const direction = changes ? changes >= 0 ? 'color-success' : 'color-danger' : ''
    return <div className="panel stat-card billing-counter">
        <div className="dimmed text-tiny">{title}</div>
        <div className="billing-counter-value">
            {formatWithAutoPrecision(value)}
            {!!changes && <code className={cn('text-tiny billing-counter-change', direction)}>
                {changes > 0 && '+'}{changes}%
            </code>}
        </div>
    </div>
}