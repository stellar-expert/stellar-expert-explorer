import React,{useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import OperationsView from '../operation/operations-history-view'
import TradesView from '../effect/trades-history-view'
import AssetTokenHoldersList from './asset-holders-list-view'
import AssetPaymentsChart from './charts/asset-payments-chart-view'
import AssetTradesChart from './charts/asset-trades-chart-view'
import AssetMarkets from './asset-markets-view'

export default function AssetHistoryTabsView({asset}) {
    if (!asset) return null
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')

    const operationsHistoryProps = {
        endpoint: `asset/${asset.descriptor.toString()}/history/${operationsFilter}`
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, skip: undefined, order: undefined})
    }

    const tabs = [
        {
            name: 'all',
            title: 'All Operations',
            isDefault: true,
            render: () => <div>
                <OperationsView {...operationsHistoryProps}/>
            </div>
        },
        {
            name: 'payments',
            title: 'Payments',
            render: () => <div>
                <AssetPaymentsChart asset={asset.descriptor}/>
                <OperationsView {...operationsHistoryProps} filter="payments"/>
            </div>
        },
        {
            name: 'offers',
            title: 'Offers',
            render: () => <div>
                <OperationsView {...operationsHistoryProps} filter="offers"/>
            </div>
        },
        {
            name: 'trades',
            title: 'Trades',
            render: () => <div>
                <AssetTradesChart asset={asset}/>
                <TradesView {...operationsHistoryProps}/>
            </div>
        },
        {
            name: 'trustlines',
            title: 'Trustlines',
            render: () => <div>
                <OperationsView {...operationsHistoryProps} filter="trustlines"/>
            </div>
        },
        {
            name: 'markets',
            title: 'Markets',
            render: () => <div>
                <AssetMarkets asset={asset}/>
            </div>
        },
        {
            name: 'asset-holders',
            title: 'Asset Holders',
            render: () => <div>
                <AssetTokenHoldersList asset={asset}/>
            </div>
        }
    ]

    if (asset.descriptor.isNative) {
        tabs.splice(3, 1)
    }

    return <Tabs className="card space" tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}