import React from 'react'
import {AccountAddress, Amount, UtcTimestamp} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'
import decodeType from '../operation/operation-type-mapper'
import {resolvePath} from '../../../business-logic/path'

export default function PaymentLocatorResultsView({payments}) {
    const {data, loaded, loading} = payments
    if (loading) return <div className="loader"/>
    if (!loaded) return null
    return <>
        <table className="table exportable" data-export-prefix="payments">
            <thead>
            <tr>
                <th>Operation</th>
                <th>Amount</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Date</th>
            </tr>
            </thead>
            <tbody>
            {data.map(op => <tr key={op.id}>
                <td><a href={resolvePath(`tx/${op.tx_id}#${op.id}`)}>{op.id}</a></td>
                <td><Amount amount={op.amount} asset={op.asset}/></td>
                <td><AccountAddress account={op.from} chars={8}/></td>
                <td><AccountAddress account={op.to} chars={8}/></td>
                <td>{decodeType(op.optype)}</td>
                <td className="nowrap"><UtcTimestamp date={op.ts} dateOnly/></td>
            </tr>)}
            </tbody>
        </table>
        <GridDataActionsView model={payments} allowJump={false}/>
    </>
}