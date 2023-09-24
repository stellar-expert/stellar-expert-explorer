import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'

export default function ContractHistoryTabsView({contract}) {
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'all')
    const operationsHistoryProps = {
        endpoint: `account/${contract}/history/${operationsFilter}`,
        presetFilter: {account: [contract]}
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
        }
    ]

    return <Tabs right tabs={tabs} className="space" selectedTab={operationsFilter} onChange={selectTab}/>
}