import React, {useCallback, useEffect, useState} from 'react'
import {Amount, UpdateHighlighter, ledgerStream, useStellarNetwork} from '@stellar-expert/ui-framework'
import {apiCall} from '../../../models/api'
import {resolvePath} from '../../../business-logic/path'
import {parseLedgerResponse} from '../../../business-logic/ledger-info'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'

export default function LedgerActivityView({title}) {
    const network = useStellarNetwork()
    const [ledgerInfo, setLedgerInfo] = useState(null)
    const [error, setError] = useState(false)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        let active = true
        let previousLedger
        setLedgerInfo(null)
        setError(false)

        function processLedger(data) {
            if (!active) return
            const ledger = parseLedgerResponse(data)
            //Initial and streamed requests can finish out of order.
            if (previousLedger && ledger.sequence <= previousLedger.sequence) return
            const timeDelta = previousLedger ? ledger.ts - previousLedger.ts : 6
            previousLedger = ledger
            setLedgerInfo({...ledger, timeDelta})
            setError(false)
        }

        function handleError() {
            if (active) setError(true)
        }

        const onNewLedger = sequence => apiCall('ledger/' + sequence).then(processLedger).catch(handleError)
        //Keep listening after an initial failure so a subsequent valid ledger can recover the panel.
        ledgerStream.on(onNewLedger)
        ledgerStream.getLast()
            .then(processLedger)
            .catch(handleError)

        return () => {
            active = false
            ledgerStream.off(onNewLedger)
        }
    }, [network, retry])

    const retryLoading = useCallback(() => {
        setRetry(value => value + 1)
    }, [])

    if (error)
        return <div role="alert" className="segment warning space">
            <p>Live ledger data is unavailable.</p>
            <button type="button" onClick={retryLoading}>Retry</button>
        </div>

    if (!ledgerInfo)
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
