import React from 'react'
import {Button} from '@stellar-expert/ui-framework'
import UserCardView from './user-card-view'
import UserListFilterView from './user-list-filter'

/**
 * Accounts matching the list filter, as the API found them - Stargazer accounts are left out unless the filter
 * asks for them, or looks an account up by email or for a custom tariff request
 * @param {{accounts: Account[], total: Number, hiddenFree: Number, next: String|null}} result
 * @param {Function} onFilterChange
 * @param {Boolean} isLoading - a new filter is being applied
 * @param {Function} onLoadMore
 * @param {Boolean} isLoadingMore
 */
export default function UserListView({result, onFilterChange, isLoading, onLoadMore, isLoadingMore}) {
    const {accounts = [], hiddenFree = 0, next} = result || {}

    return <div>
        <UserListFilterView onChange={onFilterChange}/>
        <div className={isLoading ? 'dimmed' : undefined}>
            {accounts.map(account => <UserCardView key={account.id} account={account}/>)}
        </div>
        {!accounts.length && <div className="double-space text-center dimmed">No users match the filter</div>}
        {!!next && <div className="space text-center">
            <Button onClick={onLoadMore} disabled={isLoading || isLoadingMore}>
                {isLoadingMore ? 'Loading…' : `Show more (${result.total - accounts.length} left)`}
            </Button>
        </div>}
        {!!hiddenFree && <div className="space text-center text-small dimmed">
            {hiddenFree} Stargazer {hiddenFree === 1 ? 'user' : 'users'} hidden. Add the “Include Stargazer users”
            filter to show them.
        </div>}
    </div>
}
