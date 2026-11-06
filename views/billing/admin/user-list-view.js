import React, {useMemo, useState} from 'react'
import {isAwaitingCustomTariff, isOnFreePlan} from '../../../business-logic/billing/account-status'
import UserCardView from './user-card-view'
import UserListFilterView from './user-list-filter'

export default function UserListView({accounts = []}) {
    const [filter, setFilter] = useState({})

    const {matched, hiddenFree} = useMemo(() => filterAccounts(accounts, filter), [accounts, filter])

    return <div>
        <UserListFilterView onChange={setFilter}/>
        {matched.map(account => <UserCardView key={account.id} account={account}/>)}
        {!matched.length && <div className="double-space text-center dimmed">
            {accounts.length ? 'No users match the filter' : 'No user accounts yet'}
        </div>}
        {!!hiddenFree && <div className="space text-center text-small dimmed">
            {hiddenFree} Stargazer {hiddenFree === 1 ? 'user' : 'users'} hidden. Add the “Include Stargazer users”
            filter to show them.
        </div>}
    </div>
}

/**
 * Accounts on the free plan are left out unless the filter asks for them - they are counted instead
 * @param {Account[]} accounts
 * @param {{email: String, zeroBalance: String, customTariff: String, stargazer: String}} filter
 * @return {{matched: Account[], hiddenFree: Number}}
 */
function filterAccounts(accounts, {email, zeroBalance, customTariff, stargazer}) {
    const search = email?.trim().toLowerCase()
    const matched = []
    let hiddenFree = 0
    for (const account of accounts) {
        if (search && !account.email?.toLowerCase().includes(search))
            continue
        //a spent balance stops the account from serving requests, whatever its plan says
        if (zeroBalance && account.balance > 0)
            continue
        if (customTariff && !isAwaitingCustomTariff(account))
            continue
        if (!stargazer && isOnFreePlan(account)) {
            hiddenFree++
            continue
        }
        matched.push(account)
    }
    return {matched, hiddenFree}
}
