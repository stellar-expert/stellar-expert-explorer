import React from 'react'
import {useRouteMatch} from 'react-router'
import {Amount, AssetLink, UtcTimestamp, InfoTooltip as Info, useExplorerApi, usePageMetadata} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import appSettings from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'
import CrawlerScreen from '../../components/crawler-screen'
import LiquidityPoolTvlChartView from './liquidity-pool-tvl-chart-view'
import LiquidityPoolTradesChartView from './liquidity-pool-trades-chart-view'
import LiquidityPoolFeesChartView from './liquidity-pool-fees-chart-view'
import LiquidityPoolHistoryTabsView from './liquidity-pool-history-tabs-view'

function MultiAmount({amount, asset}) {
    return <>
        <Amount amount={amount[1]} asset={asset[1]} adjust round issuer={false}/>
        &nbsp;<i className="icon icon-plus text-tiny dimmed"/>&nbsp;
        <Amount amount={amount[0]} asset={asset[0]} adjust round issuer={false}/>
    </>
}

function PoolSummaryView({poolInfo}) {
    if (!poolInfo)
        return <div className="loader"/>
    const [assetA, assetB] = poolInfo.assets.map(a => AssetDescriptor.parse(a.asset))
    return <>
        <div className="row">
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <dl>
                        <dt>Total value locked:</dt>
                        <dd>
                            <span className="dimmed">~</span><Amount amount={poolInfo.total_value_locked} adjust round asset="USD"/>
                            <Info>Estimated value of all tokens locked in the pool.</Info>
                        </dd>
                        <dt>Pool type:</dt>
                        <dd>ConstantProduct
                            <Info>Liquidity pool type determines basic pool properties and price quotation algorithm.</Info>
                        </dd>
                        <dt>Pool fee:</dt>
                        <dd>{poolInfo.fee / 100}%
                            <Info>Fee rate charged from every trade against this liquidity pool.</Info>
                        </dd>
                        <dt>Created:</dt>
                        <dd><UtcTimestamp date={poolInfo.created}/>
                            <Info>The timestamp of the first established liquidity pool trustline.</Info>
                        </dd>
                        <dt>Participants:</dt>
                        <dd>
                            {formatWithAutoPrecision(poolInfo.accounts)}
                            <Info>Total number of accounts which deposited funds to the pool.</Info>
                        </dd>
                        <dt>Trades:</dt>
                        <dd>
                            {formatWithAutoPrecision(poolInfo.trades)}
                            <Info>Total number of trades executed against this pool.</Info>
                        </dd>
                        <dt>Liquidity:</dt>
                        <dd>
                            <MultiAmount amount={poolInfo.assets.map(a => a.amount)} asset={[assetA, assetB]}/>
                        </dd>
                        <dt>Earned fees:</dt>
                        <dd>
                            <MultiAmount amount={poolInfo.earned_fees.map(a => a.all_time)} asset={[assetA, assetB]}/>
                        </dd>
                        <dt>Trading volume:</dt>
                        <dd>
                            <MultiAmount amount={poolInfo.volume.map(a => a.all_time)} asset={[assetA, assetB]}/>
                        </dd>
                    </dl>
                </div>
            </div>
            <CrawlerScreen>
                <div className="micro-space mobile-only"/>
                <div className="column column-50 relative">
                    <LiquidityPoolTvlChartView id={poolInfo.id}/>
                </div>
            </CrawlerScreen>
        </div>
        <CrawlerScreen>
            <div className="row space">
                <div className="column column-50 relative">
                    <LiquidityPoolTradesChartView id={poolInfo.id}/>
                </div>
                <div className="micro-space mobile-only"/>
                <div className="column column-50 relative">
                    <LiquidityPoolFeesChartView id={poolInfo.id}/>
                </div>
            </div>
            <LiquidityPoolHistoryTabsView id={poolInfo.id}/>
        </CrawlerScreen>
    </>
}

export default function LiquidityPoolView() {
    const {params} = useRouteMatch()
    const {loaded, error, data} = useExplorerApi(`liquidity-pool/${params.id}`)

    usePageMetadata({
        title: `Liquidity pool ${data?.assets ? data.assets.map(a => a.asset.split('-')[0]).join('/') : params.id}`,
        description: `Classic liquidity pool ${data?.assets ? data.assets.map(a => a.asset).join('/') : params.id}.`
    })

    if (data?.error) {
        return <ErrorNotificationBlock>
            Failed to load liquidity pool data.
        </ErrorNotificationBlock>
    }

    return <div>
        <h2><span className="dimmed">Liquidity Pool</span> <AssetLink asset={params.id} link={false} issuer={true}/></h2>
        {!loaded && <div className="loader"/>}
        {!!error && <ErrorNotificationBlock>Failed to load liquidity pool data</ErrorNotificationBlock>}
        {!error && !!data && <PoolSummaryView poolInfo={data}/>}
        <div className="space"/>
    </div>
}