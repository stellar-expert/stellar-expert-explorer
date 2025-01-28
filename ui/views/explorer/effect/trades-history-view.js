import React from 'react'
import {AssetLink, Amount, AccountAddress, OfferLink, UtcTimestamp, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {formatPrice} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import GridDataActionsView from '../../components/grid-data-actions'
import {resolvePath} from '../../../business-logic/path'

export default function TradesHistoryView({endpoint}) {
    const trades = useExplorerPaginatedApi({path: endpoint, query: {order: 'desc'}}, {
        autoReverseRecordsOrder: true,
        limit: 40
    })
    const {loaded, loading, data} = trades

    if (!loaded)
        return <div className="loader"/>
    if (!data.length)
        return <div className="space dimmed text-center">(no trades)</div>

    return <div className="relative segment blank space">
        {loading && data.length > 0 && <div className="loader cover"/>}
        <table className="table exportable" data-export-prefix="trades">
            <thead>
                <tr>
                    <th>Trade</th>
                    <th className="collapsing">Date</th>
                </tr>
            </thead>
            <tbody>
                {data.map(trade => {
                    const {
                        operation,
                        offer,
                        pool,
                        seller,
                        sold_asset,
                        buyer,
                        bought_asset,
                        sold_amount,
                        bought_amount,
                        price,
                        paging_token,
                        ts
                    } = trade
                    const sold = AssetDescriptor.parse(sold_asset)
                    const bought = AssetDescriptor.parse(bought_asset)
                    const counter = pool ?
                        <>on&nbsp;<AssetLink asset={pool}/>&nbsp;pool</> :
                        <>on&nbsp;offer&nbsp;<OfferLink offer={offer}/>&nbsp;by&nbsp;<AccountAddress account={seller} chars={8}/></>

                    return <tr key={paging_token}>
                        <td data-header="Trade: ">
                            <AccountAddress account={buyer} chars={8}/> exchanged{' '}
                            <Amount amount={sold_amount} asset={sold} adjust/> <i className="icon icon-shuffle  color-primary"/>{' '}
                            <Amount amount={bought_amount} asset={bought} adjust/> at{' '}
                            <span className="nowrap">
                                {formatPrice(price, 4)}{bought.toCurrency()}/{sold.toCurrency()}
                            </span>{' '}
                            {counter}
                            <div className="mobile-only">
                                <span className="dimmed">Operation:&nbsp;</span>
                                <a href={resolvePath('op/' + operation)} className="nowrap">{operation}</a>
                            </div>
                        </td>
                        <td data-header="Date: ">
                            <a href={resolvePath('op/' + operation)} className="nowrap"><UtcTimestamp date={ts} className="nowrap"/></a>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <GridDataActionsView model={trades}/>
    </div>
}