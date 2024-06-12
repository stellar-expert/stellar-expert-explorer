import React, {useEffect, useState} from 'react'
import {
    UtcTimestamp,
    TxOperationsList,
    parseStellarGenericId,
    loadTransaction,
    parseTxDetails,
    AccountAddress
} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'
import appSettings from '../../../app-settings'
import SearchResultsSectionView from './search-results-section-view'

export default function OperationSearchResultsView({term, onLoaded}) {
    const [inProgress, setInProgress] = useState(true)
    const [tx, setTx] = useState(null)
    const {tx: txid, operationOrder} = parseStellarGenericId(term)
    useEffect(() => {
        setInProgress(true)
        loadTransaction(txid)
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
        link: resolvePath(`op/${term}`),
        title: <>
            Transaction {tx.txHash.substr(0, 8)}&hellip;{tx.txHash.substr(-8)}{' '}
            {tx.successful ? '' : <span className="details">(failed)</span>}
        </>,
        description: <>
            <UtcTimestamp date={tx.createdAt} dateOnly/>{' | '}
            Source <AccountAddress account={tx.tx.source} chars={12}/>
            <div className="micro-space">
                <TxOperationsList parsedTx={tx} filter={(op, i) => operationOrder === (i + 1)} showEffects={false}/>
            </div>
            <div className="micro-space"/>
        </>,
        links: <>
            <a href={resolvePath(`account/${tx.tx.source}`)}>Transaction source account</a>&emsp;
            <a href={resolvePath(`ledger/${tx.ledger}`)}>Ledger</a>
        </>
    }
    onLoaded(res)

    return <SearchResultsSectionView key="operation" section="Operations" items={[res]}/>
}