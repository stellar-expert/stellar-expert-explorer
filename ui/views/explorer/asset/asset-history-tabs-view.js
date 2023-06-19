import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'
import TradesView from '../effect/trades-history-view'
import AssetTokenHoldersList from './asset-holders-list-view'
import AssetTradesChart from './charts/asset-trades-chart-view'
import AssetMarkets from './asset-markets-view'

export default function AssetHistoryTabsView({asset}) {
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')

    const operationsHistoryProps = {
        endpoint: `asset/${asset.descriptor.toString()}/history/${operationsFilter}`,
        context: asset,
        presetFilter: {asset: [asset.asset]}
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, skip: undefined, order: undefined})
    }

    const tabs = [
        {
            name: 'history',
            title: 'History',
            isDefault: true,
            render: () => <TxHistoryView {...operationsHistoryProps}/>
        },
        {
            name: 'trades',
            title: 'Trades',
            render: () => <>
                <AssetTradesChart asset={asset}/>
                <TradesView {...operationsHistoryProps}/>
            </>
        },
        {
            name: 'markets',
            title: 'Markets',
            render: () => <AssetMarkets asset={asset}/>
        },
        {
            name: 'asset-holders',
            title: 'Asset Holders',
            render: () => <AssetTokenHoldersList asset={asset}/>
        }
    ]
    return <Tabs right tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}