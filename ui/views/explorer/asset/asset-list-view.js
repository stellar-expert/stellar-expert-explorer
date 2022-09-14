import React from 'react'
import {AssetLink, Amount, Button, UtcTimestamp, useDependantState, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {navigation} from '@stellar-expert/navigation'
import Dropdown from '../../components/dropdown'
import AssetSparkLine from './charts/asset-sparkline-chart-view'
import AssetPriceChange from './asset-price-change'
import GridDataActionsView from '../../components/grid-data-actions'
import {resolvePath} from '../../../business-logic/path'

const orderOptions = [
    {value: 'rating', title: 'overall rating'},
    {value: 'volume7d', title: 'weekly trade volume'},
    {value: 'volume', title: 'overall trade volume'},
    {value: 'trustlines', title: 'asset holders'},
    {value: 'payments', title: 'total payments'},
    {value: 'created', title: 'asset age'}
]

export default function AssetListView({rows = 30, compact = false}) {
    const [{sort, order}, setState] = useDependantState(() => {
        const {sort = 'rating', order = 'desc'} = navigation.query
        return {
            sort,
            order
        }
    }, [compact])
    const assets = useExplorerPaginatedApi(
        {
            path: 'asset/',
            query: {
                sort,
                search: navigation.query.search
            }
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: order,
            limit: rows || 20,
            defaultQueryParams: {sort: 'rating', order: 'desc'}
            //dynamic price spread
            //dataProcessingCallback: records => records.map(stat => AssetViewModel.fromStats(stat))
        })

    function setSort(sort) {
        const order = sort === 'created' ? 'asc' : 'desc'
        navigation.updateQuery({cursor: undefined, skip: undefined, sort, order})
        setState({sort, order})
    }

    if (!assets.loaded) return <div className="loader"/>
    return <div className="asset-list-view">
        <div className="text-right mobile-left" style={{marginTop: '-2.2em'}}>
            Sort by <Dropdown options={orderOptions} onChange={value => setSort(value)} value={sort}/>
        </div>
        <table className="table exportable space" data-export-prefix="assets">
            <thead>
                <tr>
                    <th>Asset</th>
                    {!compact && <>
                        <th className="collapsing" key="created">Created</th>
                        <th className="collapsing nowrap text-right" key="supply">Supply</th>
                        <th className="collapsing text-right" key="holders">Holders</th>
                        <th className="collapsing text-right" key="transfers">Payments</th>
                    </>}
                    <th className="collapsing text-right">Price (24h)</th>
                    <th className="collapsing export-ignore nowrap">Price (7d)</th>
                </tr>
            </thead>
            <tbody className="condensed">
                {assets.data.map(({asset, supply, created, trustlines, payments, price7d = []}) => {
                    const descriptor = AssetDescriptor.parse(asset)
                    const priceDynamic = price7d.map(([ts, price]) => [ts * 1000, price])
                    return <tr key={descriptor.toString()}>
                        <td data-header="Asset: ">
                            <AssetLink asset={descriptor} displayIssuer/>
                        </td>
                        {!compact && <>
                            <td className="nowrap" key="created" data-header="Created: ">
                                <UtcTimestamp date={created} dateOnly/>
                            </td>
                            <td className="nowrap text-right" key="supply" data-header="Supply: ">
                                <Amount amount={supply} adjust round/>
                            </td>
                            <td className="holders text-right" key="holders" data-header="Holders: ">
                                <Amount amount={trustlines.total}/>
                            </td>
                            <td className="transfers text-right" key="transfers" data-header="Payments: ">
                                <Amount amount={payments}/>
                            </td>
                        </>}
                        <td className="nowrap text-right" data-header="Price (24h): ">
                            <AssetPriceChange priceDynamic={priceDynamic} compact={compact}/>
                        </td>
                        <td className="sparkline-container text-right export-ignore" data-header="Price (7d): ">
                            <AssetSparkLine sparklineData={priceDynamic} asset={descriptor} currency="USD"/>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <div className="text-center">
            {!compact ?
                <GridDataActionsView model={assets}/> :
                <div className="space">
                    <Button small className="text-small" href={resolvePath('asset')}>Explore all Stellar assets</Button>
                </div>}
        </div>
    </div>
}