import React from 'react'
import {AccountAddress, useExplorerApi, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {getCssVar, hexToRgbArray, rgbArrayToRgba} from '../../../util/css-var-utils'
import GridDataActionsView from '../../components/grid-data-actions'
/*import LiquidityPoolHolderPositionView from './liquidity-pool-holder-position-view'*/

export default function LiquidityPoolHoldersListView({pool}) {
    const poolInfo = useExplorerApi(`liquidity-pool/${pool}`)
    const holders = useExplorerPaginatedApi(`liquidity-pool/${pool}/holders`, {
        autoReverseRecordsOrder: true,
        limit: 50,
        defaultSortOrder: 'desc',
        defaultQueryParams: {order: 'desc'}
    }, [pool])

    if (!holders.loaded || !poolInfo.loaded)
        return <div className="loader"/>
    const totalShares = poolInfo.data.shares

    const bg = rgbArrayToRgba(hexToRgbArray(getCssVar('--color-price-up')), 0.15)

    return <div className="segment blank">
        {/*<LiquidityPoolHolderPositionView pool={pool} shares={totalShares}/>*/}
        <table className="table exportable space" data-export-prefix={pool + '-pool-holders'}>
            <thead>
                <tr>
                    <th>Account</th>
                    <th className="text-right collapsing nowrap">Pool Share</th>
                </tr>
            </thead>
            <tbody>
                {holders.data.map(holder => {
                    const share = formatWithAutoPrecision(100 * holder.balance / totalShares)
                    const rowStyle = {backgroundImage: `linear-gradient(to left, ${bg} ${share}%, transparent ${share}%)`}

                    return <tr key={holder.account} style={rowStyle}>
                        <td data-header="Account: ">
                            <AccountAddress account={holder.account} chars="all"/>
                        </td>
                        <td data-header="Pool Share: " className="text-right nowrap">{share}%</td>
                    </tr>
                })}
            </tbody>
        </table>
        <GridDataActionsView model={holders}/>
    </div>
}