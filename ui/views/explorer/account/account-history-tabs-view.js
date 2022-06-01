import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import OperationsView from '../operation/operations-history-view'
import TradesView from '../effect/trades-history-view'
import AccountTradesChart from './charts/account-trades-chart-view'
import AccountPaymentsChart from './charts/account-payments-chart-view'
import AccountOffers from './account-offers-view'

export default function AccountHistoryTabsView({account}) {
    if (!account) return null
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')
    const operationsHistoryProps = {
        endpoint: `account/${account.address}/history/${operationsFilter}`,
        ts: account.ts
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
                <AccountPaymentsChart address={account.address}/>
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
                <AccountTradesChart address={account.address}/>
                <TradesView {...operationsHistoryProps}/>
            </div>
        },
        {
            name: 'settings',
            title: 'Settings',
            render: () => <div>
                <OperationsView {...operationsHistoryProps} filter="settings"/>
            </div>
        },
        {
            name: 'active-offers',
            title: 'Active Offers',
            render: () => <div>
                <AccountOffers address={account.address}/>
            </div>
        }
    ]

    return <Tabs tabs={tabs} className="card space" selectedTab={operationsFilter} onChange={selectTab}/>
}