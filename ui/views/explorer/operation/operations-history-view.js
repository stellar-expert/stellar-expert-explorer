import React from 'react'
import {UtcTimestamp, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'
import GridDataActionsView from '../../components/grid-data-actions'
import OperationEffects from './operation-effects-view'
import OperationRowDescription from './operation-row-description-view'

export default function OperationsHistoryView({endpoint}) {
    const operations = useExplorerPaginatedApi({path: endpoint, query: {order: 'desc'}}, {
            autoReverseRecordsOrder: true,
            limit: 100,
            defaultQueryParams: {order: 'desc'}
        }),
        {loaded, loading, data} = operations
    if (!data.length) {
        if (!loaded) return <div className="loader"/>
        return <div className="space dimmed text-center">(no operations)</div>
    }
    return <div className="relative">
        {loading && data.length > 0 && <div className="loader cover"/>}
        <table className="table exportable" data-export-prefix="operations">
            <thead>
            <tr>
                <th className="collapsing">Operation</th>
                <th>Details</th>
                <th className="collapsing">Date</th>
            </tr>
            </thead>
            <tbody>
            {data.map(op => <tr key={op.id}>
                <td className="vtop condensed" data-header="Operation: ">
                    <a href={resolvePath(`op/${op.id}`)} className="nowrap">{op.id}</a>
                </td>
                <td data-header="Details: ">
                    <OperationEffects operation={op}>
                        <OperationRowDescription op={op}/>
                    </OperationEffects>
                </td>
                <td className="vtop" data-header="Date: ">
                    <UtcTimestamp date={op.ts} className="nowrap"/>
                </td>
            </tr>)}
            </tbody>
        </table>
        <GridDataActionsView model={operations}/>
    </div>
}