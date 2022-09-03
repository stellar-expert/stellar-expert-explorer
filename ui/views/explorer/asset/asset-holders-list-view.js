import React from 'react'
import PropTypes from 'prop-types'
import {AccountAddress, Amount, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {getCssVar, hexToRgbArray, rgbArrayToRgba} from '../../../util/css-var-utils'
import GridDataActionsView from '../../components/grid-data-actions'
import AssetHolderPositionView from './asset-holder-position-view'
import AssetDistributionChartView from './charts/asset-distribution-chart-view'

export default function AssetHoldersListView({asset}) {
    const assetId = asset.descriptor.toString(),
        totalSupply = asset.supply,
        holders = useExplorerPaginatedApi(`asset/${assetId}/holders`, {
            autoReverseRecordsOrder: true,
            limit: 50,
            defaultSortOrder: 'desc',
            defaultQueryParams: {order: 'desc'}
        }, [assetId])

    if (!holders.loaded) return <div className="loader"/>

    const bg = rgbArrayToRgba(hexToRgbArray(getCssVar('--color-price-up')), 0.15)

    return <div>
        <AssetDistributionChartView asset={asset}/>
        <AssetHolderPositionView asset={asset}/>
        <table className="table exportable space" data-export-prefix={assetId + '-holders'}>
            <thead>
            <tr>
                <th>Account</th>
                <th className="text-right collapsing nowrap">Account balance</th>
            </tr>
            </thead>
            <tbody>
            {holders.data.map(holder => {
                let share,
                    rowStyle
                if (totalSupply > 0) {
                    share = 100 * holder.balance / totalSupply
                    if (share > 0.01) {
                        share = share.toFixed(2)
                        rowStyle = {
                            backgroundImage: `linear-gradient(to left, ${bg} ${share}%, transparent ${share}%)`
                        }
                    } else {
                        share = undefined
                    }
                }

                return <tr key={holder.position} style={rowStyle}>
                    <td data-header="Account: ">
                        <AccountAddress account={holder.account} chars="all"/>
                    </td>
                    <td data-header="Balance: " className="text-right nowrap">
                        <Amount adjust icon={false} amount={holder.balance} asset={asset.descriptor.toCurrency()}/>
                        {share > 0 && <span className="dimmed text-small"> ({share}%)</span>}
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <GridDataActionsView model={holders}/>
    </div>
}

AssetHoldersListView.propTypes = {
    asset: PropTypes.object.isRequired
}