import React from 'react'
import {useParams} from 'react-router'
import {UtcTimestamp, AccountAddress, ScVal, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'

export default function ContractDataEntriesView() {
    const {id} = useParams()
    const contractDataEntries = useExplorerPaginatedApi(
        {
            path: `contract-data/${id}`,
            query: {}
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'asc',
            limit: 30,
            defaultQueryParams: {order: 'asc'}
            //dynamic price spread
            //dataProcessingCallback: records => records.map(stat => AssetViewModel.fromStats(stat))
        })

    return <div>
        <h2 className="word-break relative condensed">
            <span className="dimmed">Stored Data for&nbsp;</span>
            <AccountAddress account={id} className="plain" chars="all"/>
        </h2>
        <div className="segment blank">
            <div className="contract-data-view">
                <table className="table exportable space">
                    <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th className="collapsing nowrap">Updated</th>
                    </tr>
                    </thead>
                    <tbody className="condensed">
                    {contractDataEntries.data.map(entry => {
                        return <tr key={entry.paging_token}>
                            <td data-header="Key: ">
                                <ScVal value={entry.key} indent/>
                            </td>
                            <td data-header="Value: ">
                                <ScVal value={entry.value} indent/>
                            </td>
                            <td className="text-right" data-header="Updated: ">
                                <UtcTimestamp date={entry.updated}/>
                            </td>
                        </tr>
                    })}
                    </tbody>
                </table>
                {!contractDataEntries.loaded && <div className="loader"/>}
                <GridDataActionsView model={contractDataEntries}/>
            </div>
        </div>
    </div>
}
