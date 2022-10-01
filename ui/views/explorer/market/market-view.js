import React from 'react'
import {useRouteMatch} from 'react-router'
import {AssetLink, Amount, InfoTooltip as Info, useExplorerApi} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithPrecision} from '@stellar-expert/formatter'
import {navigation} from '@stellar-expert/navigation'
import appSettings from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import {resolvePath} from '../../../business-logic/path'
import ErrorNotificationBlock from '../../components/error-notification-block'
import MarketPriceChartView from './market-price-chart-view'
import Orderbook from './orderbook-details-view'
import MarketTrades from './market-trades-view'
import './market.scss'

function MarketSummaryView({marketInfo, buying, selling}) {
    if (!marketInfo) return <div className="loader"/>
    return <>
        <div className="row">
            <div className="column column-50">
                <div className="card">
                    <h3>Summary</h3>
                    <hr/>
                    <dl>
                        <dt>Base asset:</dt>
                        <dd><AssetLink asset={buying} displayIssuer/>
                            <Info>An asset being bought on the market.</Info>
                        </dd>
                        <dt>Quote asset:</dt>
                        <dd><AssetLink asset={selling} displayIssuer/>
                            <Info>An asset being sold on the market.</Info>
                        </dd>
                        <dt>Total trades:</dt>
                        <dd>{formatWithPrecision(marketInfo.trades)}
                            <Info>Total count of all trades on this market.</Info>
                        </dd>
                        <dt>24h trades:</dt>
                        <dd>{formatWithPrecision(marketInfo.trades24h)}
                            <Info>Total count of trades on this market during the last 24 hours.</Info>
                        </dd>
                        <dt>24h base volume:</dt>
                        <dd><Amount amount={marketInfo.base_volume24h} asset={selling} adjust decimals={2}/>
                            <Info>Total volume of the base asset on this market within the last 24 hours.</Info>
                        </dd>
                        <dt>24h counter volume:</dt>
                        <dd><Amount amount={marketInfo.counter_volume24h} asset={buying} adjust decimals={2}/>
                            <Info>Total volume of the counter asset on this market within the last 24 hours.</Info>
                        </dd>
                        <dt>7d base volume:</dt>
                        <dd>
                            <Amount amount={marketInfo.base_volume7d} asset={selling} adjust decimals={2}/>
                            <Info>Total volume of the base asset on this market within the last week.</Info>
                        </dd>
                        <dt>7d counter volume:</dt>
                        <dd>
                            <Amount amount={marketInfo.counter_volume7d} asset={buying} adjust decimals={2}/>
                            <Info>Total volume of the counter asset on this market within the last week.</Info>
                        </dd>
                        {marketInfo.slippage >= 0 && <>
                            <dt>Slippage resilience:</dt>
                            <dd>
                                {marketInfo.slippage * 100}%
                                <Info>Market slippage resilience rating based on large volume trades simulations.
                                    The higher this value - the more liquidity is in the market.</Info>
                            </dd>
                        </>}
                    </dl>
                </div>
            </div>
            <div className="column column-50 relative">
                <div className="card">
                    <MarketPriceChartView buying={buying} selling={selling} currency={selling.toCurrency()}/>
                </div>
            </div>
        </div>
        <div className="row space">
            <div className="column column-50">
                <div className="card">
                    <h3>Orderbook</h3>
                    <hr/>
                    <div className="space">
                        <Orderbook selling={buying} buying={selling}/>
                    </div>
                </div>
            </div>
            <div className="column column-50">
                <div className="card">
                    <h3>Recent Trades</h3>
                    <hr/>
                    <div className="relative" style={{height: 'calc(100% - 3em)'}}>
                        <MarketTrades baseAsset={buying} counterAsset={selling}/>
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default function MarketView() {
    const {params} = useRouteMatch(),
        selling = AssetDescriptor.parse(params.selling),
        buying = AssetDescriptor.parse(params.buying),
        {loading, error, data} = useExplorerApi(`market/${selling.toString()}/${buying.toString()}`)

    setPageMetadata({
        title: `Live market data of ${buying.toString()}/${selling.toString()} trading pair on Stellar ${appSettings.activeNetwork} network DEX`,
        description: `Statistics and price dynamic of ${buying.toString()}/${selling.toString()} trading pair on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })

    function reverse() {
        navigation.navigate(resolvePath(`market/${buying.toString()}/${selling.toString()}/`))
    }

    return <div className="market-view">
        <h2><span className="dimmed">Market</span> <AssetLink asset={buying} displayIssuer/>&nbsp;
            <a href="#" className="market-reverse" title="Reverse assets" onClick={reverse}>
                <i className="icon icon-shuffle"/>
                <i className="icon icon-exchange"/>
            </a>
            &nbsp;
            <AssetLink asset={selling} displayIssuer/></h2>
        {loading && <div className="loader"/>}
        {!!error && <ErrorNotificationBlock>Failed to load market data</ErrorNotificationBlock>}
        {!error && !!data && <MarketSummaryView marketInfo={data} selling={selling} buying={buying}/>}
        <div className="space"/>
    </div>
}