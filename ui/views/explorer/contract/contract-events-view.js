import React, {useState} from 'react'
import {
    withErrorBoundary,
    AccountAddress,
    useExplorerPaginatedApi,
    UtcTimestamp,
    ScVal,
    formatExplorerLink
} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'
import ContractFilterView from './contract-filter-view'

export default withErrorBoundary(function ContractEventsView({contract}) {
    const [filter, setFilter] = useState({})
    const contractEvents = useExplorerPaginatedApi(
        {
            path: `contract/${contract}/events`,
            query: filter
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'desc',
            updateLocation: true,
            limit: 20,
            defaultQueryParams: {order: 'desc'}
        })

    return <div className="relative segment blank">
        <ContractFilterView onChange={setFilter}/>
        <table className="table exportable micro-space">
            <thead>
            <tr>
                <th>Topics</th>
                <th>Body</th>
                <th className="collapsing">Initiator</th>
                <th className="collapsing">Date</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {contractEvents.data.map(entry => {
                const [operationId] = entry.id.split('-')
                return <tr key={entry.paging_token}>
                <td data-header="Topics: " style={{verticalAlign: 'top', minWidth: '15em'}}>
                    <ScVal value={entry.topicsXdr} indent/>
                </td>
                <td data-header="Body: " style={{verticalAlign: 'top'}}>
                    <ScVal value={entry.bodyXdr} indent/>
                </td>
                <td className="nowrap" data-header="Initiator: " style={{verticalAlign: 'top'}}>
                    <AccountAddress account={entry.initiator}/>
                </td>
                <td className="nowrap" data-header="Date: " style={{verticalAlign: 'top'}}>
                    <a href={formatExplorerLink('op', operationId)}><UtcTimestamp date={entry.ts}/></a>
                </td>
            </tr>})}
            </tbody>
        </table>
        {!contractEvents.loaded && <div className="loader"/>}
        {contractEvents.loaded && !contractEvents.data.length && <div className="dimmed text-center text-small">
            (No event entries)
        </div>}
        <GridDataActionsView model={contractEvents}/>
    </div>
})