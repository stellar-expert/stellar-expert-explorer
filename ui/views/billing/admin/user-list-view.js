import React, {useMemo, useState} from 'react'
import {isAwaitingCustomTariff} from '../../../business-logic/billing/account-status'
import UserCardView from './user-card-view'
import UserListFilterView from './user-list-filter'

export default function UserListView({accounts = [], onUpdate}) {
    const [filter, setFilter] = useState({})

    const matched = useMemo(() => filterAccounts(accounts, filter), [accounts, filter])

    return <div>
        <UserListFilterView onChange={setFilter}/>
        {matched.map(account => <UserCardView key={account.id} account={account} onUpdate={onUpdate}/>)}
        {!matched.length && <div className="double-space text-center dimmed">
            {accounts.length ? 'No users match the filter' : 'No user accounts yet'}
        </div>}
    </div>
}

/**
 * @param {Account[]} accounts
 * @param {{email: String, zeroBalance: String, customTariff: String}} filter
 * @return {Account[]}
 */
function filterAccounts(accounts, {email, zeroBalance, customTariff}) {
    const search = email?.trim().toLowerCase()
    if (!search && !zeroBalance && !customTariff)
        return accounts
    return accounts.filter(account => {
        if (search && !account.email?.toLowerCase().includes(search))
            return false
        //a spent balance stops the account from serving requests, whatever its plan says
        if (zeroBalance && account.balance > 0)
            return false
        if (customTariff && !isAwaitingCustomTariff(account))
            return false
        return true
    })
}