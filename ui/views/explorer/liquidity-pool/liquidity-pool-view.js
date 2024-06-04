import React, {useEffect, useState} from 'react'
import {useRouteMatch} from 'react-router'
import {Amount, AssetLink, UtcTimestamp, InfoTooltip as Info, useExplorerApi, setPageMetadata} from '@stellar-expert/ui-framework'
import {useAssetMeta} from '@stellar-expert/ui-framework/asset/asset-meta-hooks'
import {formatDateUTC, formatWithAutoPrecision, fromStroops} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import appSettings from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'
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
    if (!poolInfo) return <div className="loader"/>
    const [assetA, assetB] = poolInfo.assets.map(a => AssetDescriptor.parse(a.asset))
    const AssetAMeta = useAssetMeta(assetA)
    const AssetBMeta = useAssetMeta(assetB)

    const [metadata, setMetadata] = useState({
        title: `${assetB.toString()}/${assetA.toString()} liquidity pool on Stellar ${appSettings.activeNetwork} network`,
        description: `Statistics and analytics of ${assetB.toString()}/${assetA.toString()} liquidity pool on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        if (!AssetAMeta || !AssetBMeta)
            return null
        const infoList = [
            {'name': 'Pool asset', value: AssetBMeta, type: 'asset'},
            {'name': 'Pool asset', value: AssetAMeta, type: 'asset'},
            {'name': 'Total value locked', value: `~${formatWithAutoPrecision(fromStroops(poolInfo.total_value_locked))} USD`},
            {'name': 'Pool type', value: 'ConstantProduct'},
            {'name': 'Pool fee', value: `${poolInfo.fee / 100}%`},
            {'name': 'Created', value: formatDateUTC(poolInfo.created)},
            {'name': 'Participants', value: formatWithAutoPrecision(poolInfo.accounts)},
            {'name': 'Trades', value: formatWithAutoPrecision(poolInfo.trades)},
        ]
        previewUrlCreator(prepareMetadata({
            title: `${assetB?.code}/${assetA?.code} liquidity pool`,
            infoAssets: true,
            infoList
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [AssetBMeta, AssetAMeta])

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
            <div className="micro-space mobile-only"/>
            <div className="column column-50 relative">
                <LiquidityPoolTvlChartView id={poolInfo.id}/>
            </div>
        </div>
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
    </>
}

export default function LiquidityPoolView() {
    const {params} = useRouteMatch()
    const {loaded, error, data} = useExplorerApi(`liquidity-pool/${params.id}`)

    return <div>
        <h2><span className="dimmed">Liquidity Pool</span> <AssetLink asset={params.id} link={false} issuer={true}/></h2>
        {!loaded && <div className="loader"/>}
        {!!error && <ErrorNotificationBlock>Failed to load liquidity pool data</ErrorNotificationBlock>}
        {!error && !!data && <PoolSummaryView poolInfo={data}/>}
        <div className="space"/>
    </div>
}