import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'
import {ContractInterfaceView} from './contract-interface-view'
import ContractUsersView from './contract-users-view'

export default function ContractTabsView({contract}) {
    const {query} = navigation
    const [operationsFilter, setOpFilter] = useState(query.filter || 'history')
    const operationsHistoryProps = {
        endpoint: `account/${contract.address}/history/${operationsFilter}`,
        presetFilter: {account: [contract.address]}
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
        }
    ]
    if (contract.wasm) {
        tabs.push({
            name: 'interface',
            title: 'Interface',
            render: () => <ContractInterfaceView hash={contract.wasm}/>
        })
    }
    tabs.push({
        name: 'users',
        title: 'Contract Activity',
        render: () => <ContractUsersView contract={contract.address} functions={contract.functions}/>
    })

    return <Tabs right tabs={tabs} className="space" selectedTab={operationsFilter} onChange={selectTab}/>
}