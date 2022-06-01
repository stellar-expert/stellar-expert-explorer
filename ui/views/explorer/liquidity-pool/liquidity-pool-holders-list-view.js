import React from 'react'
import {AccountAddress, useExplorerApi, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {getCssVar, hexToRgbArray, rgbArrayToRgba} from '../../../util/css-var-utils'
import GridDataActionsView from '../../components/grid-data-actions'
import LiquidityPoolHolderPositionView from './liquidity-pool-holder-position-view'

export default function LiquidityPoolHoldersListView({pool}) {
    const poolInfo = useExplorerApi(`liquidity-pool/${pool}`),
        holders = useExplorerPaginatedApi(`liquidity-pool/${pool}/holders`, {
            autoReverseRecordsOrder: true,
            limit: 50,
            defaultSortOrder: 'asc',
            defaultQueryParams: {order: 'asc'}
        }, [pool])

    if (!holders.loaded || !poolInfo.loaded) return <div className="loader"/>
    const totalShares = poolInfo.data.shares

    const bg = rgbArrayToRgba(hexToRgbArray(getCssVar('--color-price-up')), 0.15)

    return <div>
        <LiquidityPoolHolderPositionView pool={pool} shares={totalShares}/>
        <table className="table exportable space" data-export-prefix={pool + '-pool-holders'}>
            <thead>
            <tr>
                <th className="collapsing text-right">Rank</th>
                <th>Account</th>
                <th className="text-right collapsing nowrap">Pool Share</th>
            </tr>
            </thead>
            <tbody>
            {holders.data.map(holder => {
                let share = formatWithAutoPrecision(100 * holder.stake / totalShares),
                    rowStyle = {backgroundImage: `linear-gradient(to left, ${bg} ${share}%, transparent ${share}%)`}

                return <tr key={holder.position} style={rowStyle}>
                    <td data-header="Rank: " className="text-right">{holder.position}</td>
                    <td data-header="Account: ">
                        <AccountAddress account={holder.account} chars="all"/>
                    </td>
                    <td data-header="Pool Share: " className="text-right nowrap">
                        {share}%
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <GridDataActionsView model={holders}/>
    </div>
}