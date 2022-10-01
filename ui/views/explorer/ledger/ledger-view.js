import React from 'react'
import {BlockSelect, Amount, UtcTimestamp, InfoTooltip as Info, useDependantState, formatExplorerLink, loadLedger} from '@stellar-expert/ui-framework'
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
    const sequence = parseInt(match.params.sequence) || 0
    const [{ledger, error}, setState] = useDependantState(() => {
        setPageMetadata({
            title: `Ledger ${sequence} on Stellar ${appSettings.activeNetwork} network`,
            description: `Extensive blockchain information for the ledger ${sequence} on Stellar ${appSettings.activeNetwork} network.`
        })
        loadLedger(sequence)
            .then(ledger => setState({ledger, error: null}))
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


    if (error) return <ErrorNotificationBlock>{error}</ErrorNotificationBlock>
    if (!ledger) return <div className="loader"/>
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
        <h2 className="relative">Ledger <BlockSelect>{ledger.sequence}</BlockSelect>
            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html">A ledger represents the
                state of
                the Stellar network at a given point in time. It contains the list of all the accounts and balances,
                all the orders in the distributed exchange, and any other data that persists.
            </Info><Tracer endpoint={`ledgers/${ledger.sequence}`}/></h2>
        <div className="card">
            <h3>Summary <Tracer endpoint={`ledgers/${ledger.sequence}`}/></h3>
            <hr/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Closed at:</dt>
                        <dd>
                            <UtcTimestamp date={ledger.closed_at}/>
                            <Info>The ledger timestamp in a form of UNIX date. Stellar network on average generates new
                                ledger each 4 seconds.
                            </Info>
                        </dd>
                        <dt>Ledger hash:</dt>
                        <dd>
                            <BlockSelect title={ledger.hash + ' (click to select the whole hash)'}
                                         style={{maxWidth: '12em', textOverflow: 'ellipsis', overflow: 'hidden'}}>{ledger.hash}</BlockSelect>
                            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html#ledger-header">The
                                hash of the ledger which represent the unique digital signature of the current network
                                state.</Info>
                        </dd>
                        <dt>Transactions:</dt>
                        <dd>
                            {formatTransactionsCount(ledger)}
                            <Info>Total number of transactions included into the ledger.</Info>
                        </dd>
                        {ledger.failed_transaction_count > 0 ? <>
                            <dt>Failed transactions:</dt>
                            <dd><BlockSelect>{ledger.failed_transaction_count}</BlockSelect>
                                <Info>The number of transactions failed during consensus.</Info>
                            </dd>
                        </> : ''}
                    </dl>
                </div>
                <div className="column column-50">
                    <dl>
                        <dt className="dimmed">Total Existing XLM:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.total_coins} asset="XLM"/></BlockSelect>
                            <Info>Total number of lumens in existence at the time of the ledger closing.</Info>
                        </dd>
                        <dt>Base Fee:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.base_fee_in_stroops} asset="XLM" adjust/></BlockSelect>
                            <Info>The fee the network charges per operation in a transaction.</Info>
                        </dd>
                        <dt>Fee Pool:</dt>
                        <dd>
                            <BlockSelect><Amount amount={ledger.fee_pool} asset="XLM"/></BlockSelect>
                            <Info>Number of lumens that have been paid in fees. This number will be added to the
                                inflation pool and reset to 0 the next time inflation runs.</Info>
                        </dd>
                        <dt>Protocol version:</dt>
                        <dd>
                            <a href={resolvePath('protocol-history')}>{ledger.protocol_version}</a>
                            <Info
                                link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
                                Protocol defines the serialized forms of all objects stored in the ledger and its
                                behavior.
                                This version number is incremented every time the protocol changes over time.
                            </Info>
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