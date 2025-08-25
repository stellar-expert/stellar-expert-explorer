import React, {useCallback, useState} from 'react'
import {Dropdown, Tabs, AssetLink, UpdateHighlighter} from '@stellar-expert/ui-framework'
import {useExplorerPaginatedApi, usePageMetadata} from '@stellar-expert/ui-framework'
import {formatPrice, formatWithAbbreviation} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {navigation} from '@stellar-expert/navigation'
import appSettings from '../../../app-settings'
import {resolvePath} from '../../../business-logic/path'
import GridDataActionsView from '../../components/grid-data-actions'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AssetSparkLine from '../asset/charts/asset-sparkline-chart-view'

const orderOptions = [
    {value: 'volume24h', title: 'daily volume'},
    {value: 'trades', title: 'total trades'},
    {value: 'trades24h', title: 'daily trades'},
    {value: 'created', title: 'age'}
]

function MarketsListContentView({markets}) {
    const {data} = markets
    return <>
        <table className="table compact exportable active" data-export-prefix="markets">
            <thead>
            <tr>
                <th rowSpan={2}>Market pair</th>
                <th className="collapsing text-right nowrap" rowSpan={2}>Price</th>
                <th className="collapsing text-center nowrap" rowSpan={2}>Orderbook<br/>Spread</th>
                {/*<th colSpan={2} className="collapsing text-center">Change</th>*/}
                <th colSpan={2} className="collapsing text-center">Volume</th>
                <th colSpan={2} className="collapsing text-center">Trades</th>
                <th className="collapsing text-center export-ignore nowrap" style={{minWidth: '5.8em'}}
                    rowSpan={2}>Dynamic
                </th>
            </tr>
            <tr>
                {/*<th className="collapsing text-center nowrap">24h</th>
                    <th className="collapsing text-center nowrap">7d</th>*/}
                <th className="collapsing text-right nowrap">24h</th>
                <th className="collapsing text-right nowrap">7d</th>
                <th className="collapsing text-right nowrap">24h</th>
                <th className="collapsing text-right nowrap">Total</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {data.map(market => {
                const sellingAsset = AssetDescriptor.parse(market.asset[0])
                const buyingAsset = AssetDescriptor.parse(market.asset[1])

                return <tr key={market.id}
                           onClick={() => navigation.navigate(resolvePath(`market/${sellingAsset.toString()}/${buyingAsset.toString()}`))}>
                    <td data-header="Market pair: ">
                        <div>
                            <AssetLink asset={buyingAsset} issuer link={false} className="nowrap"/>
                        </div>
                        <div>
                            <AssetLink asset={sellingAsset} issuer link={false} className="nowrap"/>
                        </div>
                    </td>
                    <td className="nowrap text-right" data-header="Price: ">
                        <UpdateHighlighter>{!market.price ? null : formatPrice(1 / market.price, 4)}</UpdateHighlighter>{' '}
                        <span className="dimmed text-tiny">{buyingAsset.toCurrency()}/{sellingAsset.toCurrency()}</span>
                    </td>
                    <td className="nowrap text-right" data-header="Spread: ">
                        <UpdateHighlighter>{!market.spread ? null : (formatPrice(market.spread * 100, 3) + '%')}</UpdateHighlighter>
                    </td>
                    {/*<td className="nowrap text-center" data-header="Change 24h: ">
                            {market.change24h != undefined &&
                                <PriceDynamic change={market.change24h} standalone allowZero/>}
                        </td>
                        <td className="nowrap text-center" data-header="Change 7d: ">
                            {market.change7d != undefined &&
                                <PriceDynamic change={market.change7d} standalone allowZero/>}
                        </td>*/}
                    <td className="nowrap text-right" data-header="Volume 24h: ">
                        {formatWithAbbreviation(market.counterVolume24h / 10000000, 2)}&thinsp;
                        <AssetLink asset={market.asset[0]} link={false} icon={false} issuer={false} className="dimmed text-tiny"/>
                    </td>
                    <td className="nowrap text-right" data-header="Volume 7d: ">
                        {formatWithAbbreviation(market.counterVolume7d / 10000000, 2)}&thinsp;
                        <AssetLink asset={market.asset[0]} link={false} icon={false} issuer={false} className="dimmed text-tiny"/>
                    </td>
                    <td className="nowrap text-right" data-header="Trades 24h: ">
                        {formatPrice(market.trades24h || 0)}
                    </td>
                    <td className="nowrap text-right" data-header="Total trades: ">
                        {formatPrice(market.trades)}
                    </td>
                    <td className="sparkline-container text-right export-ignore" data-header="Price 7d: "
                        colSpan={2}>
                        {market.price7d && <AssetSparkLine sparklineData={market.price7d}
                                                           currency={AssetDescriptor.parse(market.asset[0]).toCurrency()}/>}
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <GridDataActionsView model={markets}/>
    </>
}

export default function AllMarketsView() {
    const {asset} = navigation.query
    const [type, setType] = useState(navigation.query.type || 'all')
    const [sort, setSort] = useState(navigation.query.sort || orderOptions[0].value)

    const markets = useExplorerPaginatedApi({path: 'market', query: {type, sort, asset}}, {
        autoReverseRecordsOrder: true,
        limit: 20,
        defaultSortOrder: 'desc',
        defaultQueryParams: {sort: orderOptions[0].value, order: 'desc', type: 'all'}
    })
    const {loaded} = markets

    usePageMetadata({
        title: `Active DEX markets on Stellar ${appSettings.activeNetwork} network`,
        description: `Statistics and price dynamic of active markets on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })

    const updateSort = useCallback(function (sort = orderOptions[0].value) {
        setSort(sort)
        navigation.updateQuery({sort, order: 'desc'})
    }, [])

    if (!loaded) return <div className="loader"/>
    if (markets.data?.error) {
        return <ErrorNotificationBlock>
            Failed to load active DEX markets.
        </ErrorNotificationBlock>
    }
    return <>
        <h2>Markets {asset && <>for asset <AssetLink asset={asset}/></>}</h2>
        <div className="desktop-only" style={{marginTop: '-3em'}}/>
        <Tabs right queryParam="type" tabs={[{
            name: 'all',
            title: 'All',
            isDefault: true
        }, {
            name: 'xlm',
            title: 'XLM'
        }, {
            name: 'fiat',
            title: 'Fiat'
        }, {
            name: 'crypto',
            title: 'Crypto'
        }, {
            name: 'other',
            title: 'Other'
        }
        ]} selectedTab={type} onChange={tabName => {
            setType(tabName)
            navigation.updateQuery({cursor: undefined, order: undefined})
        }}>
        </Tabs>
        <div className="segment blank">
            <div className="text-right text-small dimmed">
                Sort by <Dropdown options={orderOptions} onChange={updateSort} value={sort}/>
            </div>
            <div className="micro-space"/>
            <MarketsListContentView markets={markets}/>
        </div>
    </>
}