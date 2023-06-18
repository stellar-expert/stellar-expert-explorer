import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Dropdown, useDependantState, loadOrderbook} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithAutoPrecision, formatWithGrouping} from '@stellar-expert/formatter'
import {getCssVar, hexToRgbArray, rgbArrayToRgba} from '../../../util/css-var-utils'

const depthOptions = [{value: 10}, {value: 20}, {value: 40}, {value: 100}]

function parseOrderbookEntry({price, amount}, group, side) {
    const originalPrice = parseFloat(price)
    const approximatedPrice = side === 'bid' ?
        Math.floor(originalPrice / group) * group :
        Math.ceil(originalPrice / group) * group

    return {
        amount: parseFloat(amount),
        price: approximatedPrice,
        originalPrice
    }
}

function processOrderbookData(orderbook, group, size) {
    const bids = []
    let buyDepth = 0
    let buyBestPrice
    let lastBid

    for (const entry of orderbook.bids) {
        const {price, amount, originalPrice} = parseOrderbookEntry(entry, group, 'bid')
        if (originalPrice === 0)
            continue
        if (!buyBestPrice) {
            buyBestPrice = originalPrice
        }
        buyDepth += amount
        const bid = {
            price,
            base: amount / originalPrice,
            counter: amount,
            depth: buyDepth
        }
        if (lastBid?.price === price) {
            lastBid.base += bid.base
            lastBid.counter += bid.counter
            lastBid.depth = buyDepth
        } else {
            if (bids.length >= size) break
            lastBid = bid
            bids.push(bid)
        }
    }

    const asks = []
    let sellDepth = 0
    let sellBestPrice
    let lastAsk

    for (const entry of orderbook.asks) {
        const {price, amount, originalPrice} = parseOrderbookEntry(entry, group)
        if (originalPrice === 0) continue
        if (!sellBestPrice) {
            sellBestPrice = originalPrice
        }
        const dv = amount * originalPrice
        sellDepth += dv
        const ask = {
            price,
            base: amount,
            counter: dv,
            depth: sellDepth
        }
        if (lastAsk?.price === price) {
            lastAsk.base += ask.base
            lastAsk.counter += ask.counter
            lastAsk.depth = sellDepth
        } else {
            if (asks.length >= size) break
            lastAsk = ask
            asks.push(ask)
        }
    }

    asks.reverse()

    const res = {
        bids,
        asks,
        maxDepth: Math.max(buyDepth, sellDepth)
    }

    if (sellBestPrice !== undefined && buyBestPrice !== undefined) {
        res.spread = sellBestPrice - buyBestPrice
        res.medianPrice = (sellBestPrice + buyBestPrice) / 2
    }
    return res
}

function getMedianGroupExponent(medianPrice) {
    return Math.floor(Math.log10(medianPrice))
}


function generatePrecisionGroup(digits) {
    return parseFloat(Math.pow(10, digits).toPrecision(1))
}

function getGroups(medianPrice) {
    const digits = getMedianGroupExponent(medianPrice)
    if (isNaN(digits)) return [0]

    return [generatePrecisionGroup(digits - 5),
        generatePrecisionGroup(digits - 4),
        generatePrecisionGroup(digits - 3),
        generatePrecisionGroup(digits - 2),
        generatePrecisionGroup(digits - 1),
        generatePrecisionGroup(digits),
        generatePrecisionGroup(digits + 1),
        generatePrecisionGroup(digits + 2)]
}

const buyBackground = rgbArrayToRgba(hexToRgbArray(getCssVar('--color-price-up')), 0.15)
const sellBackground = rgbArrayToRgba(hexToRgbArray(getCssVar('--color-price-down')), 0.15)


function OrderbookRowView({offer, maxDepth, group, side, base, counter}) {
    const depthPercentage = Math.min(100, (offer.depth / maxDepth * 100).toFixed(2))
    const priceColor = side === 'buy' ? 'var(--color-price-up)' : 'var(--color-price-down)'
    const rowStyle = {
        backgroundImage: `linear-gradient(to left, ${side === 'buy' ? buyBackground : sellBackground} ${depthPercentage}%, transparent ${depthPercentage}%)`
    }
    return <tr style={rowStyle}>
        <td style={{color: priceColor}}>{formatWithGrouping(offer.price, group)} {counter}/{base}</td>
        <td className="text-right">{formatWithAutoPrecision(offer.base)}</td>
        <td className="text-right">{formatWithAutoPrecision(offer.depth)}</td>
    </tr>
}

export default function OrderbookDetailsView({selling, buying}) {
    const [size, setSize] = useState(20)
    const [group, setGroup] = useState(undefined)
    const [loading, setLoading] = useState(true)
    const [rawOrderbookData, setRawOrderbookData] = useDependantState(() => {
        setLoading(true)
        loadOrderbook(selling, buying, {limit: 200})
            .then(data => {
                setRawOrderbookData(data)
                setLoading(false)
            })
    }, [selling, buying])
    const [orderbook, setOrderbook] = useDependantState(() => {
        if (!rawOrderbookData)
            return null
        const processed = processOrderbookData(rawOrderbookData, group, size)
        processed.base = AssetDescriptor.parse(selling).toCurrency()
        processed.counter = AssetDescriptor.parse(buying).toCurrency()
        if (group === undefined) {
            const priceExponent = getMedianGroupExponent(processed.medianPrice)
            setGroup(generatePrecisionGroup(priceExponent - 3))
        }
        return processed
    }, [rawOrderbookData, group, size])

    if (loading)
        return <div className="loader"/>

    const {bids, asks, spread, medianPrice, base, counter} = orderbook
    const spreadPercentage = 100 * spread / medianPrice
    const precisionOptions = getGroups(medianPrice).map(v => ({value: v, title: v.toString()}))

    return <>
        <div className="desktop-right text-small">
            Depth: <Dropdown className="text-small" onChange={setSize} value={size} options={depthOptions}/>
            &emsp;
            <div className="mobile-only"/>
            Precision: <Dropdown className="text-small" onChange={setGroup} value={group} options={precisionOptions}/>
        </div>
        <div className="micro-space"/>
        <table className="table compact text-small">
            <thead>
                <tr className="dimmed">
                    <th className="text-left">Price</th>
                    <th className="text-right">{base}</th>
                    <th className="text-right">Market depth, {counter}</th>
                </tr>
            </thead>
            <tbody>
                {asks.map(offer => <OrderbookRowView key={offer.depth} {...orderbook} group={group} offer={offer} side="sell"/>)}
                <tr>
                    <td colSpan="3">
                        Price spread: {formatWithAutoPrecision(spread)} {counter} ({formatWithAutoPrecision(spreadPercentage)}%)
                    </td>
                </tr>
                {bids.map(offer => <OrderbookRowView key={offer.depth} {...orderbook} group={group} offer={offer} side="buy"/>)}
            </tbody>
        </table>
    </>
}

OrderbookDetailsView.propTypes = {
    selling: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)]).isRequired,
    buying: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)])
}