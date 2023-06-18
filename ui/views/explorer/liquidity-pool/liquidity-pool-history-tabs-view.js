import React,{useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'
import TradesView from '../effect/trades-history-view'
import LiquidityPoolHoldersListView from './liquidity-pool-holders-list-view'

export default function LiquidityPoolHistoryTabsView({id}) {
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')

    const operationsHistoryProps = {
        endpoint: `liquidity-pool/${id}/history/${operationsFilter}`,
        presetFilter: {pool: [id]}
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, order: undefined})
    }

    const tabs = [
        {
            name: 'all',
            title: 'History',
            isDefault: true,
            render: () => <TxHistoryView {...operationsHistoryProps}/>
        },
        {
            name: 'trades',
            title: 'Trades',
            render: () => <TradesView {...operationsHistoryProps}/>
        },
        {
            name: 'asset-holders',
            title: 'Participants',
            render: () => <LiquidityPoolHoldersListView pool={id}/>
        }
    ]

    return <Tabs right className="space" tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}