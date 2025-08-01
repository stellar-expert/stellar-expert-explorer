import React from 'react'
import {Dropdown, useDependantState} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {navigation} from '@stellar-expert/navigation'
import {resolvePath} from '../../../business-logic/path'
import {apiCall} from '../../../models/api'
import OrderbookDetails from '../market/orderbook-details-view'
import MarketTrades from '../market/market-trades-view'

export default function AssetMarketsView({asset}) {
    if (!asset)
        return null
    const assetId = asset.descriptor.toString()

    const [selectedMarket, setSelectedMarket] = useDependantState(() => navigation.query.market || null, [assetId])

    const [tradingPairs, setTradingPairs] = useDependantState(() => {
        apiCall(`asset/${assetId}/trading-pairs`)
            .then(pairs => {
                if (!(pairs instanceof Array))
                    return null
                pairs = (pairs || []).map(v => ({
                    value: v,
                    title: AssetDescriptor.parse(v).toCurrency(12)
                }))
                if (pairs.length) {
                    if (!selectedMarket || !pairs.some(pair => pair.value === selectedMarket)) {
                        if (pairs.some((pair => pair.value === 'XLM'))) {
                            select('XLM')
                        } else {
                            select(pairs[0].value)
                        }
                    }
                } else {
                    setSelectedMarket(null)
                }
                setTradingPairs(pairs || [])
            })
    }, [assetId])

    function select(market) {
        if (market === 'all') {
            navigation.navigate(resolvePath('market?asset=' + assetId))
            return
        }
        setSelectedMarket(market)
        navigation.updateQuery({market: market !== 'XLM' ? market : undefined})
    }

    if (!tradingPairs) return <div className="loader"/>
    if (!tradingPairs.length) return <div className="dimmed">No markets found</div>
    if (tradingPairs.length === 10) {
        tradingPairs.push('-')
        tradingPairs.push({value: 'all', title: `All ${asset.descriptor.toCurrency()} markets`})
    }

    const baseMarket = AssetDescriptor.parse(assetId)
    const counterAsset = AssetDescriptor.parse(selectedMarket)

    return <div className="segment blank space" style={{minHeight: '4em'}}>
        <div className="row">
            <div className="column column-50">
                <div style={{float: 'left'}} className="text-small">
                    Trading pair: <Dropdown className="text-small" onChange={v => select(v)} value={selectedMarket}
                                            options={tradingPairs}/>
                </div>
                <div className="mobile-only" style={{clear: 'both'}}/>
                <OrderbookDetails selling={baseMarket} buying={counterAsset}/>
                <div className="double-space mobile-only">
                    <div className="text-small">Recent trades</div>
                </div>
            </div>
            <div className="column column-50 relative">
                <MarketTrades baseAsset={baseMarket} counterAsset={counterAsset}/>
            </div>
        </div>
    </div>
}