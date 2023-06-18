import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'
import TradesView from '../effect/trades-history-view'
import AccountTradesChart from './charts/account-trades-chart-view'
import AccountOffers from './account-offers-view'

export default function AccountHistoryTabsView({account}) {
    if (!account)
        return null
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')
    const operationsHistoryProps = {
        endpoint: `account/${account.address}/history/${operationsFilter}`,
        presetFilter: {account: [account.address]}
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, skip: undefined, order: undefined})
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
            render: () => <>
                <AccountTradesChart address={account.address}/>
                <TradesView {...operationsHistoryProps}/>
            </>
        },
        {
            name: 'active-offers',
            title: 'Active Offers',
            render: () => <AccountOffers address={account.address}/>
        }
    ]

    return <Tabs right tabs={tabs} className="space" selectedTab={operationsFilter} onChange={selectTab}/>
}