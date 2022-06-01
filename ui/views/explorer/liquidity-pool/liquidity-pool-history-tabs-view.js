import React,{useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import OperationsView from '../operation/operations-history-view'
import TradesView from '../effect/trades-history-view'
import LiquidityPoolHoldersListView from './liquidity-pool-holders-list-view'

export default function LiquidityPoolHistoryTabsView({id}) {
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')

    const operationsHistoryProps = {
        endpoint: `liquidity-pool/${id}/history/${operationsFilter}`
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, order: undefined})
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
            name: 'settings',
            title: 'Deposits/Withdrawals',
            render: () => <div>
                <OperationsView {...operationsHistoryProps} filter="settings"/>
            </div>
        },
        {
            name: 'trades',
            title: 'Trades',
            render: () => <div>
                <TradesView {...operationsHistoryProps}/>
            </div>
        },
        {
            name: 'asset-holders',
            title: 'Asset Holders',
            render: () => <div>
                <LiquidityPoolHoldersListView pool={id}/>
            </div>
        }
    ]

    return <Tabs className="card space" tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}