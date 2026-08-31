import React, {useCallback, useEffect, useState} from 'react'
import {shortenString} from '@stellar-expert/formatter'
import {
    Amount, Button, ButtonGroup, ElapsedTime, parseFiltersFromQuery, UtcTimestamp
} from '@stellar-expert/ui-framework'
import {requestTypeStyles} from '../../../business-logic/billing/request-types'
import RequestTypeView from '../components/request-type-view'
import SegmentLoader from '../utils/segment-loader-view'
import {fetchLogs, LOGS_PAGE_SIZE} from './logs-data'
import LogsFilterView from './logs-filter'

export default function LogsView() {
    const [logs, setLogs] = useState()
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [query, setQuery] = useState(() => ({page: 0, filters: parseFiltersFromQuery() || {}}))

    const changeFilters = useCallback(filters => setQuery({page: 0, filters}), [])

    const changePage = useCallback(shift => setQuery(prev => ({...prev, page: prev.page + shift})), [])

    useEffect(() => {
        setIsLoading(true)
        fetchLogs(query.page, LOGS_PAGE_SIZE, query.filters)
            .then(res => {
                setLogs(res.items)
                setTotal(res.total)
            })
            .catch(error => notify({type: 'error', message: 'Failed to load logs. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [query])

    const canLoadPrevPage = query.page > 0
    const canLoadNextPage = (query.page + 1) * LOGS_PAGE_SIZE < total

    if (!logs && isLoading)
        return <SegmentLoader inside/>

    return <div className="relative">
        <LogsFilterView onChange={changeFilters}/>
        <table className="billing-table exportable billing-log micro-space">
            <thead>
                <tr>
                    <th>Account</th>
                    <th>Request type</th>
                    <th className="text-right">Credits</th>
                    <th className="collapsing text-right">Timestamp</th>
                </tr>
            </thead>
            <tbody className="condensed">
                {logs?.map(entry => <tr key={entry.id} className={requestTypeStyles[entry.requestType]}>
                    <td data-header="Account: ">
                        {entry.email || shortenString(entry.account)}
                    </td>
                    <td data-header="Request type: ">
                        <RequestTypeView entry={entry}/>
                    </td>
                    <td data-header="Credits: " className="text-right">
                        <Amount amount={entry.data.credits}/>
                    </td>
                    <td className="nowrap text-right" data-header="Timestamp: ">
                        <UtcTimestamp date={entry.timestamp}/>
                        <div className="dimmed text-tiny"><ElapsedTime ts={entry.timestamp} suffix=" ago"/></div>
                    </td>
                </tr>)}
            </tbody>
        </table>
        {!!isLoading && <div className="loader"/>}
        {!isLoading && !total && <div className="dimmed text-center text-small">(No log entries)</div>}
        <div className="text-center space">
            <ButtonGroup>
                <Button disabled={isLoading || !canLoadPrevPage} onClick={() => changePage(-1)}>Prev Page</Button>
                <Button disabled={isLoading || !canLoadNextPage} onClick={() => changePage(1)}>Next Page</Button>
            </ButtonGroup>
        </div>
    </div>
}