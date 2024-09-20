import React from 'react'
import {xdr} from '@stellar/stellar-base'
import {
    BlockSelect,
    Amount,
    UtcTimestamp,
    InfoTooltip as Info,
    useDependantState,
    formatExplorerLink,
    useStellarNetwork
} from '@stellar-expert/ui-framework'
import {fetchExplorerApi} from '@stellar-expert/ui-framework/api/explorer-api-call'
import appSettings from '../../../app-settings'
import {resolvePath} from '../../../business-logic/path'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import ErrorNotificationBlock from '../../components/error-notification-block'
import Tracer from '../horizon-tracer/tracer-icon-view'
import Transactions from './ledger-transactions-view'

function formatTransactionsCount(ledger) {
    if (ledger.operation_count > 0) return <BlockSelect>
        {ledger.successful_transaction_count} ({ledger.operation_count} operations)
    </BlockSelect>
    return 'no transactions'
}

export default function LedgerView({match}) {
    const network = useStellarNetwork()
    const sequence = parseInt(match.params.sequence, 10) || 0
    const [{ledger, error}, setState] = useDependantState(() => {
        setPageMetadata({
            title: `Ledger ${sequence} on Stellar ${appSettings.activeNetwork} network`,
            description: `Extensive blockchain information for the ledger ${sequence} on Stellar ${appSettings.activeNetwork} network.`
        })
        fetchExplorerApi(network + '/ledger/' + sequence)
            .then(response => {
                const parsed = xdr.LedgerHeader.fromXDR(response.xdr, 'base64')
                const ledger = {
                    sequence: parsed.ledgerSeq(),
                    ts: Number(parsed.scpValue().closeTime().toBigInt()/1000n),
                    protocol: parsed.ledgerVersion(),
                    xlm: parsed.totalCoins().toBigInt(),
                    baseFee: parsed.baseFee(),
                    feePool: parsed.feePool().toBigInt()
                }
                setState({ledger, error: null})
            })
            .catch(err => {
                let errorText = `Failed to load ledger ${sequence}.`
                if (err) {
                    console.error(err)
                    if (err.message === 'Not Found' || err.status === 404) {
                        errorText = 'Ledger not found. The requested sequence is greater than last known Horizon sequence.'
                    } else if (err.message === 'Bad Request') {
                        errorText = 'Ledger not found. Invalid ledger sequence.'
                    }
                }
                setState({ledger: null, error: errorText})
            })

        return {ledger: null, error: null}
    }, [sequence])


    if (error)
        return <ErrorNotificationBlock>{error}</ErrorNotificationBlock>
    if (!ledger)
        return <div className="loader"/>
    return <>
        <div style={{float: 'right', margin: '0.4em -0.4em 0px 0px', position: 'relative', zIndex: 1}}>
            <div className="text-small">
                {(sequence > 1) && <><a href={formatExplorerLink('ledger', sequence - 1)}
                                        title="Load previous ledger info">
                    <i className="icon icon-angle-double-left"/>Prev</a>&emsp;
                </>}
                <a href={formatExplorerLink('ledger', sequence + 1)}
                   title="Load next ledger info">
                    Next<i className="icon icon-angle-double-right"/>
                </a>
            </div>
        </div>
        <h2 className="relative"><span className="dimmed">Ledger</span> <BlockSelect>{ledger.sequence}</BlockSelect>
            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html">A ledger represents the
                state of the Stellar network at a given point in time. It contains the list of all the accounts and balances,
                all the orders in the distributed exchange, and any other data that persists.
            </Info><Tracer endpoint={`ledgers/${ledger.sequence}`}/></h2>
        <div className="segment blank">
            <h3>Summary <Tracer endpoint={`ledgers/${ledger.sequence}`}/></h3>
            <hr className="flare"/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Sequence:</dt>
                        <dd>
                            {ledger.sequence}
                            <Info>Unique sequential ledger identifier</Info>
                        </dd>
                        <dt>Closed at:</dt>
                        <dd>
                            <UtcTimestamp date={ledger.ts}/>
                            <Info>The ledger timestamp in a form of UNIX date. Stellar network on average generates new
                                ledger each 4 seconds.
                            </Info>
                        </dd>
                        <dt>Protocol version:</dt>
                        <dd>
                            <a href={resolvePath('protocol-history')}>{ledger.protocol}</a>
                            <Info
                                link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
                                Protocol defines the serialized forms of all objects stored in the ledger and its
                                behavior.
                                This version number is incremented every time the protocol changes over time.
                            </Info>
                        </dd>
                    </dl>
                </div>
                <div className="column column-50">
                    <dl>
                        <dt className="dimmed">Total Existing XLM:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.xlm} adjust asset="XLM" issuer={false}/></BlockSelect>
                            <Info>Total number of lumens in existence at the time of the ledger closing.</Info>
                        </dd>
                        <dt>Base Fee:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.baseFee} asset="XLM" adjust issuer={false}/></BlockSelect>
                            <Info>The fee the network charges per operation in a transaction.</Info>
                        </dd>
                        <dt>Fee Pool:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.feePool} adjust asset="XLM" issuer={false}/></BlockSelect>
                            <Info>Number of lumens that have been paid in fees. This number will be added to the
                                inflation pool and reset to 0 the next time inflation runs.</Info>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="column">
                <Transactions ledgerSequence={ledger.sequence}/>
            </div>
        </div>
    </>
}