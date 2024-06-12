import React, {useEffect, useState} from 'react'
import {AccountAddress, UtcTimestamp, TxOperationsList, loadTransaction, parseTxDetails} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'
import appSettings from '../../../app-settings'
import SearchResultsSectionView from './search-results-section-view'

export default function TransactionSearchResultsView({term, onLoaded}) {
    const [inProgress, setInProgress] = useState(true)
    const [tx, setTx] = useState(null)
    useEffect(() => {
        setInProgress(true)
        loadTransaction(term)
            .then(txResponse => {
                const parsedTx = parseTxDetails({
                    network: appSettings.networkPassphrase,
                    txEnvelope: txResponse.body,
                    result: txResponse.result,
                    meta: txResponse.meta,
                    createdAt: txResponse.ts,
                    context: {},
                    protocol: txResponse.protocol
                })
                parsedTx.id = txResponse.id
                parsedTx.ledger = txResponse.ledger
                setTx(parsedTx)
            })
            .finally(() => setInProgress(false))
    }, [term])
    if (inProgress)
        return null
    if (!tx) {
        onLoaded([])
        return null
    }
    const res = {
        link: resolvePath(`tx/${tx.id}`),
        title: <>
            Operation {term} in transaction {tx.txHash.substr(0, 8)}&hellip;{tx.txHash.substr(-8)}{' '}
            {tx.successful ? '' : <span className="details">(failed)</span>}
        </>,
        description: <>
            <UtcTimestamp date={tx.createdAt} dateOnly/>{' | '}
            Source <AccountAddress account={tx.tx.source} chars={12}/>,{' '}
            {tx.operations.length} operation{tx.operations.length !== 1 && 's'}
            <div className="space">
                <TxOperationsList parsedTx={tx} showEffects={false}/>
            </div>
        </>,
        links: <>
            <a href={resolvePath(`account/${tx.tx.source}`)}>Source account</a>&emsp;
            <a href={resolvePath(`ledger/${tx.ledger}`)}>Ledger</a>
        </>
    }
    onLoaded(res)

    return <SearchResultsSectionView key="transaction" section="Transactions" items={[res]}/>
}