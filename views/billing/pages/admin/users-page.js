import React, {useCallback, useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import UserListView from '../../admin/user-list-view'
import NewUserView from '../../admin/new-user-view'

//accounts per page - the API matches them in memory, but reads each account on the page from the datastore
const accountsPageSize = 50

/**
 * Turn the list filter into the query the API matches accounts with - the same query for filters that differ
 * only in a field still being edited, so those do not fetch again
 * @param {{email: String, zeroBalance: *, customTariff: *, stargazer: *}} filter - as `UserListFilterView` emits it
 * @return {String}
 */
function buildSearchQuery(filter) {
    const query = new URLSearchParams({limit: accountsPageSize})
    const search = filter.email?.trim()
    if (search) {
        query.set('search', search)
    }
    for (const flag of ['zeroBalance', 'customTariff', 'stargazer']) {
        if (filter[flag]) {
            query.set(flag, '1')
        }
    }
    return query.toString()
}

/**
 * Fetch one page of the accounts matching the list filter - the API does the matching, across the whole base
 * @param {String} query - from `buildSearchQuery`
 * @param {String} [cursor]
 * @return {Promise<{accounts: Account[], total: Number, hiddenFree: Number, next: String|null}>}
 */
function searchAccounts(query, cursor) {
    return apiRequest(`account?${query}${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`)
}

export default function UsersPage() {
    const {userId, synced} = useSession()
    const [filter, setFilter] = useState({})
    const [result, setResult] = useState()
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const refresh = useCallback(() => setRefreshKey(prev => ++prev), [])
    const query = buildSearchQuery(filter)

    useEffect(() => {
        if (!userId)
            return
        let cancelled = false
        setIsLoading(true)
        searchAccounts(query)
            .then(res => !cancelled && setResult(res))
            .catch(error => notify({type: 'error', message: 'Failed to retrieve accounts data. ' + error?.message}))
            .finally(() => !cancelled && setIsLoading(false))
        return () => {
            cancelled = true
        }
    }, [userId, query, refreshKey])

    const loadMore = useCallback(() => {
        setIsLoadingMore(true)
        searchAccounts(query, result.next)
            //a page for a filter that has changed since is dropped
            .then(res => setResult(prev => prev === result ? {...res, accounts: [...prev.accounts, ...res.accounts]} : prev))
            .catch(error => notify({type: 'error', message: 'Failed to retrieve accounts data. ' + error?.message}))
            .finally(() => setIsLoadingMore(false))
    }, [query, result])

    const title = <>Users{!!result &&
        <span className="dimmed text-small">&nbsp;&nbsp;{result.total} total</span>}</>
    const isPending = !synced || (isLoading && !result)

    return <SimplePageLayout title={title} action={<NewUserView onCreate={refresh}/>}>
        {isPending ?
            <SegmentLoader inside/> :
            <UserListView result={result} onFilterChange={setFilter} isLoading={isLoading} onLoadMore={loadMore}
                          isLoadingMore={isLoadingMore}/>}
    </SimplePageLayout>
}
