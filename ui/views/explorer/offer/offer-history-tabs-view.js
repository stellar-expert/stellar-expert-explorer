import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import OperationsView from '../operation/operations-history-view'
import TradesView from '../effect/trades-history-view'

export default function OfferHistoryTabsView({offer}) {
    const [operationsFilter, setOpFilter] = useState(navigation.query.filter || 'trades')
    const operationsHistoryProps = {
        endpoint: `offer/${offer.id}/history/${operationsFilter}`
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, skip: undefined, order: undefined})
    }

    const tabs = [
        {
            name: 'trades',
            title: 'Trades',
            render: () => <div>
                <TradesView {...operationsHistoryProps}/>
            </div>
        },
        {
            name: 'changes',
            title: 'Changes',
            render: () => <div>
                <OperationsView {...operationsHistoryProps} filter="offers"/>
            </div>
        }
    ]

    return <Tabs className="space card" tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}