import React, {useState} from 'react'
import {Networks} from 'stellar-sdk'
import deepMerge from 'deepmerge'
import {TxOperationsList, UtcTimestamp, ErrorBoundary} from '@stellar-expert/ui-framework'
import {useStellarNetwork, useTxHistory, parseTxDetails, formatExplorerLink, withErrorBoundary} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'
import TxFilterView from './filters/tx-filter-view'

export default withErrorBoundary(function TxHistoryView({presetFilter}) {
    const network = Networks[useStellarNetwork().toUpperCase()]
    const [filters, setFilters] = useState(presetFilter ? deepMerge({}, presetFilter) : {})
    const txHistory = useTxHistory(filters)
    const {data, loading} = txHistory
    const txList = data.map(tx => {
        try {
            return parseTxDetails({
                network,
                txEnvelope: tx.body,
                result: tx.result,
                meta: tx.meta,
                context: filters,
                createdAt: tx.ts
            })
        } catch (e) {
            console.error(e)
            return {
                txHash: tx.hash,
                createdAt: tx.ts,
                error: e.message
            }
        }
    })//.filter(tx => !!tx.operations.length)
    return <div className="relative segment blank">
        {!!loading && data.length > 0 && <div className="loader cover"/>}
        <TxFilterView presetFilter={presetFilter} onChange={setFilters}/>
        <table className="table exportable" data-export-prefix="transactions">
            <thead>
                <tr>
                    <th style={{display: 'none'}}>ID</th>
                    <th>Transaction</th>
                    <th className="collapsing">Date</th>
                </tr>
            </thead>
            <tbody>
                {txList.map(tx => <tr key={tx.txHash}>
                    <td style={{display: 'none'}}>Tx hash: {tx.txHash}</td>
                    <td>
                        {tx.error ?
                            <div className="segment segment-inline error text-tiny">Error: {tx.error}</div> :
                            <ErrorBoundary>
                                <TxOperationsList parsedTx={tx}/>
                                <TxMemo tx={tx.tx}/>
                            </ErrorBoundary>}
                    </td>
                    <td style={{verticalAlign: 'top'}} data-header="Processed: ">
                        <a href={formatExplorerLink('tx', tx.txHash)}><UtcTimestamp date={tx.createdAt} className="micro-space"/></a>
                    </td>
                </tr>)}
            </tbody>
        </table>
        {!!loading && <div className="loader"/>}
        {!loading && !data.length && <div className="dimmed text-center text-small space">(no transactions matching search criteria)</div>}
        {!!data.length && <GridDataActionsView model={txHistory}/>}
    </div>
})

const TxMemo = React.memo(function TxMemo({tx}) {
    if (!tx.memo)
        return null
    let value = tx.memo.value
    if (tx.memo.type === 'text') {
        value = value.toString()
    } else if (value instanceof Buffer) {
        value = value.toString('base64')
    }
    if (!value)
        return null
    return <div className="dimmed condensed text-tiny" style={{marginLeft: '3.6em'}}>Memo: {value}</div>
})
