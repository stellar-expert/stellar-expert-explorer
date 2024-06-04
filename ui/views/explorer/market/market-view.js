import React, {useCallback, useEffect, useState} from 'react'
import {useRouteMatch} from 'react-router'
import {AssetLink, Amount, InfoTooltip as Info, useExplorerApi, setPageMetadata} from '@stellar-expert/ui-framework'
import {useAssetMeta} from '@stellar-expert/ui-framework/asset/asset-meta-hooks'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithPrecision} from '@stellar-expert/formatter'
import {navigation} from '@stellar-expert/navigation'
import {resolvePath} from '../../../business-logic/path'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import appSettings from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'
import MarketPriceChartView from './market-price-chart-view'
import Orderbook from './orderbook-details-view'
import MarketTrades from './market-trades-view'
import './market.scss'

function MarketSummaryView({marketInfo, buying, selling}) {
    if (!marketInfo)
        return <div className="loader"/>
    return <>
        <div className="row">
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <dl>
                        <dt>Base asset:</dt>
                        <dd><AssetLink asset={buying}/>
                            <Info>An asset being bought on the market.</Info>
                        </dd>
                        <dt>Quote asset:</dt>
                        <dd><AssetLink asset={selling}/>
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
                <MarketPriceChartView buying={buying} selling={selling} currency={selling.toCurrency()}/>
            </div>
        </div>
        <div className="row space">
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Orderbook</h3>
                    <hr className="flare"/>
                    <div style={{marginTop: '-2em'}}/>
                    <Orderbook selling={buying} buying={selling}/>
                </div>
            </div>
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Recent Trades</h3>
                    <hr className="flare"/>
                    <div className="relative" style={{height: 'calc(100% - 3em)'}}>
                        <MarketTrades baseAsset={buying} counterAsset={selling}/>
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default function MarketView() {
    const {params} = useRouteMatch()
    const selling = AssetDescriptor.parse(params.selling)
    const buying = AssetDescriptor.parse(params.buying)
    const buyingAsset = buying.toString()
    const sellingAsset = selling.toString()
    const sellingAssetMeta = useAssetMeta(selling)
    const buyingAssetMeta = useAssetMeta(buying)
    const {loading, error, data} = useExplorerApi(`market/${sellingAsset}/${buyingAsset}`)

    const [metadata, setMetadata] = useState({
        title: `Live market data for ${buying?.code}/${selling?.code} trading pair on Stellar ${appSettings.activeNetwork} network DEX`,
        description: `Statistics and price dynamic for ${buying?.code}/${selling?.code} trading pair on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        if (!data || !sellingAssetMeta || !buyingAssetMeta)
            return
        const infoList = [
            {'name': 'Base asset', value: buyingAssetMeta, type: 'asset'},
            {'name': 'Quote asset', value: sellingAssetMeta, type: 'asset'},
            {'name': 'Total trades', value: formatWithPrecision(data.trades)},
            {'name': '24h trades', value: formatWithPrecision(data.trades24h)}
        ]
        if (data.slippage >= 0) {
            infoList.push({'name': 'Slippage resilience', value: data.slippage * 100 + '%'})
        }
        const preparedMetadata = prepareMetadata({
            title: `Live DEX trading data for ${buying?.code}/${selling?.code}`,
            infoList
        })
        previewUrlCreator(prepareMetadata(preparedMetadata))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [data, sellingAssetMeta, buyingAssetMeta])

    const reverse = useCallback(function () {
        navigation.navigate(resolvePath(`market/${buyingAsset}/${sellingAsset}/`))
    }, [buyingAsset, sellingAsset])

    return <div className="market-view">
        <h2><span className="dimmed">Market</span> <AssetLink asset={buying}/>&nbsp;
            <a href="#" className="market-reverse" title="Reverse assets" onClick={reverse}>
                <i className="icon icon-shuffle"/>
                <i className="icon icon-exchange"/>
            </a>
            &nbsp;
            <AssetLink asset={selling}/></h2>
        {loading && <div className="loader"/>}
        {!!error && <ErrorNotificationBlock>Failed to load market data</ErrorNotificationBlock>}
        {!error && !!data && <MarketSummaryView marketInfo={data} selling={selling} buying={buying}/>}
        <div className="space"/>
    </div>
}