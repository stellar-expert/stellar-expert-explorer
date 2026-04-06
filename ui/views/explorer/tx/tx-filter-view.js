import React from 'react'
import {FilterView} from '@stellar-expert/ui-framework'

const fieldDescriptionMapping = {
    account: {
        title: 'Account',
        description: 'Account in transaction',
        icon: 'hexagon-empty'
    },
    source: {
        title: 'Source account',
        description: 'Operation source account',
        icon: 'send-circle'
    },
    destination: {
        title: 'Destination account',
        description: 'Operation destination account',
        icon: 'receive-circle'
    },
    asset: {
        title: 'Asset',
        description: 'Asset in transaction',
        icon: 'trustlines'
    },
    src_asset: {
        title: 'Sent asset',
        description: 'Operation source asset',
        icon: 'remove-trustline'
    },
    dest_asset: {
        title: 'Received asset',
        description: 'Operation destination asset',
        icon: 'create-trustline'
    },
    type: {
        title: 'Operation type',
        description: 'Operation type',
        icon: 'puzzle'
    },
    offer: {
        title: 'Offer ID',
        description: 'DEX offer id',
        icon: 'div-circle'
    },
    pool: {
        title: 'Liquidity pool ID',
        description: 'Liquidity pool id',
        icon: 'droplet'
    },
    memo: {
        title: 'Memo',
        description: 'Transaction memo',
        icon: 'attach'
    },
    from: {
        title: 'After',
        description: 'After date',
        icon: 'angle-right',
        multi: false
    },
    to: {
        title: 'Before',
        description: 'Before date',
        icon: 'angle-left',
        multi: false
    }
}

export default function TxFilterView({presetFilter, onChange}) {
    return <FilterView presetFilter={presetFilter} fields={fieldDescriptionMapping} onChange={onChange}/>
}