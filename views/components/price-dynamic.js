import React from 'react'
import PropTypes from 'prop-types'
import {formatPrice} from '@stellar-expert/formatter'
import cn from 'classnames'
import './price-dynamic.scss'

function PriceDynamic({change, current, prev, standalone, allowZero}) {
    if (change === undefined) {
        if (current === prev || !prev || !current) {
            change = 0
        } else {
            change = 100 * (current - prev) / prev
        }
    }
    if (Math.abs(change) > 10000) return null
    const isNegative = change < 0
    change = formatPrice(Math.abs(change), 2) + '%'
    let isZero
    if (change === '0%') {
        if (!allowZero) return null
        isZero = true
    }
    const className = cn('price-change', isNegative ? 'negative' : 'positive', {zero:isZero}, {standalone})
    return <span className={className} aria-label={` (${change})`}>
        {change}
    </span>
}

PriceDynamic.propTypes = {
    change: PropTypes.number,
    current: PropTypes.number,
    prev: PropTypes.number,
    standalone: PropTypes.bool,
    allowZero: PropTypes.bool
}

export default PriceDynamic