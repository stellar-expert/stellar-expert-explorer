import React from 'react'
import PropTypes from 'prop-types'
import {Amount, ElapsedTime, useDeepEffect, useDependantState, streamMarketTrades, loadMarketTrades} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, approximatePrice} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {resolvePath} from '../../../business-logic/path'

function processTrade({id, base_amount, counter_amount, price, ledger_close_time, base_is_seller}) {
    return {
        id,
        baseAmount: base_amount,
        counterAmount: counter_amount,
        price: approximatePrice(price),
        revert: base_is_seller,
        ts: new Date(ledger_close_time)
    }
}

export default function MarketTradesView({baseAsset, counterAsset}) {
    const [trades, setTrades] = useDependantState(() => {
        loadMarketTrades(baseAsset, counterAsset, {order: 'desc', limit: 100})
            .then(newTrades => {
                addNewTrades(newTrades.map(processTrade))
            })
        return undefined
    }, [baseAsset.toFQAN(), counterAsset.toFQAN()])

    function addNewTrades(newTrades) {
        setTrades(currentTrades => {
            const res = newTrades.concat(currentTrades || [])
            while (res.length > 100) {
                res.pop()
            }
            return res
        })
    }

    useDeepEffect(() => {
        const stopTradesStream = streamMarketTrades('now', baseAsset, counterAsset, trade => addNewTrades([processTrade(trade)]))
        return stopTradesStream

    }, [baseAsset.toFQAN(), counterAsset.toFQAN()])

    if (trades === undefined) return <div className="loader"/>
    if (!trades.length) return null
    return <div className="market-trades">
        <table className="table clear condensed text-tiny micro-space">
            <tbody>
            {trades.map(({id, baseAmount, counterAmount, price, revert, ts}) => {
                const amounts = [
                    <Amount amount={baseAmount} asset={baseAsset} decimals="auto" issuer={false}/>,
                    <Amount amount={counterAmount} asset={counterAsset} decimals="auto" issuer={false}/>
                ]
                if (revert) {
                    amounts.reverse()
                }
                return <tr key={id}>
                    <td className="collapsing">
                        <a href={resolvePath(`op/${id.split('-').shift()}`)}>
                                    <span
                                        className={revert ? 'trend-up' : 'trend-down'}>{formatWithAutoPrecision(price)}</span>
                            &nbsp;
                            <span className="dimmed">{counterAsset.toCurrency()}/{baseAsset.toCurrency()}</span>
                        </a>
                    </td>
                    <td className="text-right">
                        {amounts[0]}
                    </td>
                    <td className="collapsing">
                        <i className="icon icon-shuffle color-primary"/>
                    </td>
                    <td>
                        {amounts[1]}
                    </td>
                    <td className="text-right collapsing dimmed" style={{width: '3em'}}>
                        <ElapsedTime ts={ts}/>
                    </td>
                </tr>
            })}
            </tbody>
        </table>
    </div>
}

MarketTradesView.propTypes = {
    baseAsset: PropTypes.instanceOf(AssetDescriptor).isRequired,
    counterAsset: PropTypes.instanceOf(AssetDescriptor).isRequired
}