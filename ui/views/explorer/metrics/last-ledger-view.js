import React, {useCallback, useEffect, useState} from 'react'
import {Amount, UpdateHighlighter, ledgerStream, retrieveLedgerInfo} from '@stellar-expert/ui-framework'
import {apiCall} from '../../../models/api'
import {resolvePath} from '../../../business-logic/path'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'

export default function LastLedgerView({onUpdate}) {
    let unmounted
    let lastLedgerClosedAt = 0
    const [isError, setIsError] = useState(false)
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
        onUpdate(ledger)
    }, [onUpdate])

    useEffect(() => {
        const onNewLedger = sequence => apiCall('ledger/' + sequence).then(processLedger)
        ledgerStream.getLast()
            .then(ledger => {
                if (ledger.error)
                    throw new Error(ledger.error)
                processLedger(ledger)
                //start ledgers updates streaming
                ledgerStream.on(onNewLedger)
            })
            .catch(err => setIsError(err))

        return () => {
            unmounted = true
            ledgerStream.off(onNewLedger)
        }
    }, [])

    if (!ledgerInfo.sequence && !isError)
        return <div className="loader"/>
    if (isError)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch last Ledger</div>
        </div>

    return <div className="segment blank">
        <div className="dual-layout">
            <h3 style={{margin: 0}}>Last Ledger</h3>
            <a href={resolvePath('operations-live-stream', 'explorer')} target="_blank">
                Recent Ops <i className="icon-open-new-window"/>
            </a>
        </div>
        <hr className="flare"/>
        <div className="row space">
            <div className="column column-33">
                <p className="text-huge">
                    <UpdateHighlighter>
                        #<a href={resolvePath(`ledger/${ledgerInfo.sequence}`)}>{ledgerInfo.sequence}</a>
                    </UpdateHighlighter>
                </p>
            </div>
            <div className="column column-33">
                <dl>
                    <dt>Transactions:</dt>
                    <dd><UpdateHighlighter>
                        {ledgerInfo.txSuccess} succeeded{ledgerInfo.txFailed > 0 && ` / ${ledgerInfo.txFailed} failed`}
                    </UpdateHighlighter></dd>

                    <dt>Operations:</dt>
                    <dd><UpdateHighlighter>{ledgerInfo.operations}</UpdateHighlighter></dd>

                    <dt>Ledger closing time:</dt>
                    <dd>closed in <UpdateHighlighter>{ledgerInfo.timeDelta}s</UpdateHighlighter></dd>
                </dl>
            </div>
            <div className="column column-33">
                <dl className="text-right">
                    <dt>Protocol version:</dt>
                    <dd><UpdateHighlighter>
                        <a href={resolvePath('protocol-history', 'explorer')}>{ledgerInfo.protocol}</a>
                    </UpdateHighlighter></dd>
                </dl>
            </div>
        </div>
    </div>
}