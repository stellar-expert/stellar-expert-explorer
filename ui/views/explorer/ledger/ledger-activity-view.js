import React, {useCallback, useEffect, useState} from 'react'
import {Amount, UpdateHighlighter, ledgerStream, retrieveLedgerInfo} from '@stellar-expert/ui-framework'
import {apiCall} from '../../../models/api'
import {resolvePath} from '../../../business-logic/path'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'

export default function LedgerActivityView({title, className}) {
    let unmounted
    let lastLedgerClosedAt = 0
    const [ledgerInfo, setLedgerInfo] = useState({
        sequence: 0,
        txSuccess: 0,
        txFailed: 0,
        protocol: 0,
        baseFee: 0,
        baseReserve: 0,
        timeDelta: 6
    })

    const processLedger = useCallback(ledger => {
        if (unmounted)
            return
        ledger = retrieveLedgerInfo(ledger)
        let timeDelta = 6
        if (lastLedgerClosedAt) {
            timeDelta = (ledger.ts - lastLedgerClosedAt)
        }
        lastLedgerClosedAt = ledger.ts
        setLedgerInfo({
            sequence: ledger.sequence,
            protocol: ledger.protocol,
            operations: ledger.operations,
            txSuccess: ledger.txSuccess,
            txFailed: ledger.txFailed,
            baseFee: ledger.baseFee,
            baseReserve: ledger.baseReserve,
            timeDelta
        })
    }, [])

    useEffect(() => {
        const onNewLedger = sequence => apiCall('ledger/' + sequence).then(processLedger)
        ledgerStream.getLast()
            .then(ledger => {
                processLedger(ledger)
                //start ledgers updates streaming
                ledgerStream.on(onNewLedger)
            })

        return () => {
            unmounted = true
            ledgerStream.off(onNewLedger)
        }
    }, [])

    if (!ledgerInfo.sequence)
        return <div className="loader"/>

    return <>
        <h3>
            {title || 'Ledger '}
            <UpdateHighlighter><a href={resolvePath(`ledger/${ledgerInfo.sequence}`)}>{ledgerInfo.sequence}</a></UpdateHighlighter>
            <EmbedWidgetTrigger path="network-activity/ledger" title="Stellar Network Stats"/>
        </h3>
        <hr className="flare"/>
        <dl>
            <dt>Transactions:</dt>
            <dd>
                <UpdateHighlighter>{ledgerInfo.txSuccess} succeeded{ledgerInfo.txFailed > 0 && ` / ${ledgerInfo.txFailed} failed`}</UpdateHighlighter>
            </dd>

            <dt>Operations:</dt>
            <dd><UpdateHighlighter>{ledgerInfo.operations}</UpdateHighlighter></dd>

            <dt>Ledger closing time:</dt>
            <dd><UpdateHighlighter>{ledgerInfo.timeDelta}s</UpdateHighlighter></dd>

            <dt>Protocol version:</dt>
            <dd><UpdateHighlighter><a href={resolvePath('protocol-history', 'explorer')}>{ledgerInfo.protocol}</a></UpdateHighlighter></dd>

            <dt>Base operation fee:</dt>
            <dd><UpdateHighlighter><Amount amount={ledgerInfo.baseFee} asset="XLM" issuer={false} adjust/></UpdateHighlighter></dd>

            <dt>Base reserve:</dt>
            <dd><UpdateHighlighter><Amount amount={ledgerInfo.baseReserve} asset="XLM" issuer={false} adjust/></UpdateHighlighter></dd>
        </dl>
        <div className="micro-space text-small">
            <a href={resolvePath('operations-live-stream', 'explorer')}>View operations live stream</a>
        </div>
    </>
}