import React from 'react'
import PropTypes from 'prop-types'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import PriceDynamic from '../../components/price-dynamic'

//TODO: use PriceDynamic instead
export default function AssetPriceChange({priceDynamic, digits = 2}) {
    if (!priceDynamic || priceDynamic.length < 2) return null
    let latestPrice = priceDynamic[priceDynamic.length - 1][1],
        prevPrice = priceDynamic[priceDynamic.length - 2][1]
    if (latestPrice === 0) return <span>-</span>
    return <span>
        {formatWithAutoPrecision(latestPrice, digits)}<PriceDynamic current={latestPrice} prev={prevPrice}/>
        <span className="text-small dimmed">USD</span>
    </span>
}

AssetPriceChange.propTypes = {
    priceDynamic: PropTypes.array.isRequired,
    digits: PropTypes.number
}