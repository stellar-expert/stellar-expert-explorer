import React, {useEffect} from 'react'
import {Amount, UpdateHighlighter, useDependantState, streamLedgers, loadLedgers} from '@stellar-expert/ui-framework'
import {fromStroops} from '@stellar-expert/formatter'
import {resolvePath} from '../../../business-logic/path'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'

export default function LedgerActivityView({title, updateMeta, className}) {
    let ledgersStream
    let unmounted
    const [
        {sequence, protocol, txSuccess, txFailed, operations, timeDelta, baseFee, baseReserve, lastLedgerClosedAt},
        setState
    ] = useDependantState(() => {
        //load latest ledger
        loadLedgers({order: 'desc', limit: 1})
            .then(ledgers => {
                processLedger(ledgers[0])
                //start ledgers updates streaming
                if (!ledgersStream) {
                    ledgersStream = streamLedgers('now', ledger => processLedger(ledger))
                }
            })

        return {
            sequence: 0,
            txSuccess: 0,
            txFailed: 0,
            protocol: 0,
            baseFee: 0,
            baseReserve: 0,
            timeDelta: 6
        }

    }, [title, className], () => {
        unmounted = true
        if (ledgersStream) {
            ledgersStream()
            ledgersStream = undefined
        }
    })

    useEffect(() => {
        if (!updateMeta || !protocol || !timeDelta || !baseFee || !baseReserve)
            return
        updateMeta({
            description: 'General network stats',
            infoList: [
                {name: 'Ledger closing time', value: timeDelta + 's'},
                {name: 'Protocol version', value: protocol},
                {name: 'Base operation fee', value: `${fromStroops(baseFee)} XLM`},
                {name: 'Base reserve', value: `${fromStroops(baseReserve)} XLM`}
            ]
        })
    }, [protocol, timeDelta, baseFee, baseReserve, updateMeta])

    function processLedger(ledger) {
        if (unmounted)
            return
        const time = new Date(ledger.closed_at).getTime()
        let timeDelta = 6
        if (lastLedgerClosedAt) {
            timeDelta = (time - lastLedgerClosedAt) / 1000
        }

        setState({
            sequence: ledger.sequence,
            protocol: ledger.protocol_version,
            operations: ledger.operation_count,
            txSuccess: ledger.successful_transaction_count,
            txFailed: ledger.failed_transaction_count,
            baseFee: ledger.base_fee_in_stroops,
            baseReserve: ledger.base_reserve_in_stroops,
            timeDelta,
            lastLedgerClosedAt: time
        })
    }

    if (!sequence)
        return <div className="loader"/>

    return <>
        <h3>
            {title || 'Ledger '}
            <UpdateHighlighter><a href={resolvePath(`ledger/${sequence}`)}>{sequence}</a></UpdateHighlighter>
            <EmbedWidgetTrigger path="network-activity/ledger" title="Stellar Network Stats"/>
        </h3>
        <hr className="flare"/>
        <dl>
            <dt>Transactions:</dt>
            <dd><UpdateHighlighter>{txSuccess} succeeded{txFailed > 0 && ` / ${txFailed} failed`}</UpdateHighlighter></dd>

            <dt>Operations:</dt>
            <dd><UpdateHighlighter>{operations}</UpdateHighlighter></dd>

            <dt>Ledger closing time:</dt>
            <dd><UpdateHighlighter>{timeDelta}s</UpdateHighlighter></dd>

            <dt>Protocol version:</dt>
            <dd><UpdateHighlighter><a href={resolvePath('protocol-history', 'explorer')}>{protocol}</a></UpdateHighlighter></dd>

            <dt>Base operation fee:</dt>
            <dd><UpdateHighlighter><Amount amount={baseFee} asset="XLM" issuer={false} adjust/></UpdateHighlighter></dd>

            <dt>Base reserve:</dt>
            <dd><UpdateHighlighter><Amount amount={baseReserve} asset="XLM" issuer={false} adjust/></UpdateHighlighter></dd>
        </dl>
        <div className="micro-space text-small">
            <a href={resolvePath('operations-live-stream', 'explorer')}>View operations live stream</a>
        </div>
    </>
}