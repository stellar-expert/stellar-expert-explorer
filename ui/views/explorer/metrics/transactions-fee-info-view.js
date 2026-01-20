import React, {useEffect, useState} from 'react'
import {fetchExplorerApi} from '@stellar-expert/ui-framework/api/explorer-api-call'
import {parseTxOperationsMeta} from '@stellar-expert/tx-meta-effects-parser'
import {Amount, getCurrentStellarNetwork, UpdateHighlighter} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'

export default function TransactionFeeInfoView({lastLedger}) {
    const [avgTxFee, setAvgTxFee] = useState(0)
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        setIsError(false)
        if (!lastLedger)
            return setIsError(true)
        const endpoint = `/ledger/${lastLedger.sequence}/tx`
        fetchExplorerApi(getCurrentStellarNetwork() + endpoint)
            .then(data => {
                if (!data?.length)
                    return //no data
                const txData = []
                for (let record of data) {
                    const {body, meta, result} = record
                    const parsedTx = parseTxOperationsMeta({
                        network: getCurrentStellarNetwork(),
                        tx: body,
                        result,
                        meta
                    })
                    txData.push(parsedTx)
                }
                const avgTxFee = txData.reduce((acc, cur) => acc += Number(cur.tx.fee), 0)
                setAvgTxFee(avgTxFee / txData.length)
            })
            .catch(err => setIsError(err))
    }, [lastLedger])

    if (isError)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch transactions fee data</div>
        </div>
    if (!lastLedger)
        return <div className="loader"/>

    return <div>
        <div className="space"/>
        <div className="row">
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Avg Transaction Fee <span className="text-small">(last ledger)</span></h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={avgTxFee} asset="XLM" issuer={false} adjust/></UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Base Operation Fee</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={lastLedger.baseFee} asset="XLM" issuer={false} adjust/></UpdateHighlighter>
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card card-mobile-margin">
                    <h3>Base Reserve</h3>
                    <div className="text-huge double-space">
                        <UpdateHighlighter><Amount amount={lastLedger.baseReserve} asset="XLM" issuer={false} adjust/></UpdateHighlighter>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

async function loadTxData(endpoint, txData) {
    const data = await fetch(appSettings.apiEndpoint + endpoint)
        .then(res => res.json())
        .then(res => {
            endpoint = res?._links.next.href
            return res?._embedded || {}
        })
        .catch(() => {})
    if (!data?.records?.length)
        return txData //no more data
    for (let record of data.records) {
        const {body, meta, result} = record
        const parsedTx = parseTxOperationsMeta({
            network: getCurrentStellarNetwork(),
            tx: body,
            result,
            meta
        })
        txData.push(parsedTx)
    }
    //wait second before the next call to prevent endpoint abuse
    await new Promise(resolve => setTimeout(resolve, 1000))
    await loadTxData(endpoint, txData)
}