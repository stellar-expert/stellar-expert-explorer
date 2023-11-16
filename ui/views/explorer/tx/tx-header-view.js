import React from 'react'
import {BlockSelect, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import Tracer from '../horizon-tracer/tracer-icon-view'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'
import {resolvePath} from '../../../business-logic/path'

export default function TxHeader({tx, embedded}) {
    return React.createElement(embedded ? 'h4' : 'h2', {className: 'word-break relative'},
        embedded ? <a href={resolvePath(`tx/${tx.hash}`)}>
                Transaction <BlockSelect wrap inline>{tx.hash}</BlockSelect></a> :
            <span>Transaction <BlockSelect wrap inline>{tx.hash}</BlockSelect></span>,
        <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html">
            <p>Transactions are commands that modify the ledger state. Among other things, Transactions are used to
                send payments, enter orders into the distributed exchange, change settings on accounts, and
                authorize another account to hold your currency.</p>
            <p>Each transaction has it's own unique ID that can be used to look up for the transaction.</p>
        </Info>,
        <Tracer endpoint={`transactions/${tx.hash}`}/>,
        <EmbedWidgetTrigger path={`tx/info/${tx.hash}`} title="Transaction Details"/>)
}