import React, {useEffect, useState} from 'react'
import {
    Amount, Button, ButtonGroup, ElapsedTime, parseQuery, stringifyQuery, UtcTimestamp
} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {requestTypeStyles} from '../../../business-logic/billing/request-types'
import RequestTypeView from '../components/request-type-view'
import UserBillingHistoryFilterView from './user-billing-history-filter'

const PAGE_SIZE = 20

export default React.memo(function UserBillingHistoryView({account}) {
    const [allItems, setAllItems] = useState()
    const [page, setPage] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [filters, setFilters] = useState(parseQuery())

    useEffect(() => {
        setIsLoading(true)
        setPage(0)
        apiRequest(`log/${account}/${stringifyQuery(filters)}`)
            .then(setAllItems)
            .catch(error => notify({type: 'error', message: 'Failed to load billing history. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [account, filters])

    const total = allItems?.length || 0
    const items = allItems?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const canLoadPrevPage = page > 0
    const canLoadNextPage = (page + 1) * PAGE_SIZE < total

    return <div>
        <UserBillingHistoryFilterView onChange={setFilters}/>
        <table className="table exportable billing-log space">
            <thead>
            <tr>
                <th>Request type</th>
                <th className="text-right">Credits</th>
                <th className="collapsing text-right">Timestamp</th>
            </tr>
            </thead>
            <tbody>
            {items?.map(entry => <tr key={entry.id} className={requestTypeStyles[entry.requestType]}>
                <td data-header="Request type: "><RequestTypeView entry={entry}/></td>
                <td data-header="Credits: " className="text-right">
                    <Amount amount={entry.data.credits}/>
                </td>
                <td data-header="Timestamp: " className="nowrap text-right">
                    <UtcTimestamp date={entry.timestamp}/>
                    <div className="dimmed text-tiny"><ElapsedTime ts={entry.timestamp} suffix=" ago"/></div>
                </td>
            </tr>)}
            </tbody>
        </table>
        {!!isLoading && <div className="loader"/>}
        {!isLoading && !total && <div className="dimmed text-center text-small">(No billing history entries)</div>}
        {!!total && <div className="text-center space">
            <ButtonGroup>
                <Button disabled={isLoading || !canLoadPrevPage} onClick={() => setPage(p => p - 1)}>Prev Page</Button>
                <Button disabled={isLoading || !canLoadNextPage} onClick={() => setPage(p => p + 1)}>Next Page</Button>
            </ButtonGroup>
        </div>}
    </div>
})