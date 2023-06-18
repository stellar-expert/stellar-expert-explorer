import React, {useState} from 'react'
import {Tabs} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import TxHistoryView from '../tx/tx-history-view'
import TradesView from '../effect/trades-history-view'

export default function OfferHistoryTabsView({offer}) {
    const [operationsFilter, setOpFilter] = useState(navigation.query.filter || 'trades')
    const operationsHistoryProps = {
        endpoint: `offer/${offer.id}/history/${operationsFilter}`,
        presetFilter: {offer: [offer.id]}
    }

    function selectTab(tabName) {
        setOpFilter(tabName)
        navigation.updateQuery({filter: tabName, cursor: undefined, skip: undefined, order: undefined})
    }

    const tabs = [
        {
            name: 'trades',
            title: 'Trades',
            render: () => <TradesView {...operationsHistoryProps}/>
        },
        {
            name: 'changes',
            title: 'Changes',
            render: () => <TxHistoryView {...operationsHistoryProps}/>
        }
    ]

    return <Tabs right className="space" tabs={tabs} selectedTab={operationsFilter} onChange={selectTab}/>
}