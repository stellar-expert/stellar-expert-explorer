import React from 'react'
import PropTypes from 'prop-types'
import {BlockSelect, AccountAddress, Amount, UtcTimestamp, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {resolvePath} from '../../../business-logic/path'
import TxOperationsView from '../operation/tx-operations-view'
import TxSignaturesView from './tx-signatures-view'
import TxMemoView from './tx-memo-view'
import TxHeaderView from './tx-header-view'
import TxPreconditionsView from './tx-preconditions-view'

/**
 *
 * @param {TransactionResponse} tx
 * @param embedded
 * @return {JSX.Element}
 * @constructor
 */
export default function TxDetailsView({tx, embedded}) {
    const feeSource = tx.fee_account_muxed || tx.fee_account,
        source = tx.account_muxed || tx.source_account
    return <>
        <TxHeaderView tx={tx} embedded={embedded}/>
        <div className="card">
            <h3>Summary</h3>
            <hr/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Status:</dt>
                        <dd>
                            {tx.successful ?
                                <>
                                    <i className="icon icon-ok dimmed"/><BlockSelect>Successful</BlockSelect></> :
                                <>
                                    <i className="icon icon-block dimmed"/><BlockSelect>Failed</BlockSelect></>}
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html">Whether
                                the transaction has been applied to the ledger or failed upon submission.</Info>
                        </dd>
                        <dt>Ledger:</dt>
                        <dd>
                            <a href={resolvePath('ledger/' + tx.ledger_attr)}>{tx.ledger_attr}</a>
                            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html">The ledger which
                                contains the transaction.</Info>
                        </dd>
                        <dt>Source Account:</dt>
                        <dd>
                            <AccountAddress account={source} chars={12}/>
                            <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html">This is the
                                account that originates the transaction. The transaction must be signed by this account,
                                and the transaction fee must be paid by this account. The sequence number of this
                                transaction is based off this account.</Info>
                        </dd>
                        <dt>Sequence Number:</dt>
                        <dd>
                            <BlockSelect inline className="condensed">{tx.source_account_sequence}</BlockSelect>
                            <Info
                                link="https://www.stellar.org/developers/guides/concepts/transactions.html#sequence-number">
                                <p>
                                    Each transaction has a sequence number. For the transaction to be valid, the
                                    sequence number must match the one stored in the source account entry when the
                                    transaction is applied.
                                </p>
                                After the transaction is applied, the source account’s stored sequence number
                                is incremented by 1.
                            </Info>
                        </dd>
                    </dl>
                </div>
                <div className="column column-50">
                    <dl>
                        <dt>Processed:</dt>
                        <dd>
                            <UtcTimestamp date={tx.created_at}/>
                            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html#ledger-header">
                                Enclosing ledger timestamp.</Info>
                        </dd>
                        <dt>Max Fee:</dt>
                        <dd>
                            <BlockSelect><Amount asset="XLM" amount={tx.max_fee} adjust/></BlockSelect>
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html#fee">Maximum
                                fee specified in the transaction itself – the maximum XLM amount the source account
                                willing to pay. Each transaction sets a fee that is paid by the source account. The more
                                operations in the transaction, the greater the required fee.</Info>
                        </dd>
                        <dt>Fee Charged:</dt>
                        <dd>
                            <BlockSelect><Amount asset="XLM" amount={tx.fee_charged} adjust/></BlockSelect>
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html#fee">Actually
                                charged fee which can be lower than the fee specified in the transaction. Each
                                transaction sets a fee that is paid by the source account. The more operations in the
                                transaction, the greater the required fee.</Info>
                        </dd>
                        {feeSource !== source && <>
                            <dt>Fee Source Account:</dt>
                            <dd>
                                <AccountAddress account={feeSource} chars={12}/>
                                <Info link="https://github.com/stellar/stellar-protocol/blob/master/core/cap-0015.md">
                                    The address of the account that paid fee on behalf of the source account for this
                                    transaction.</Info>
                            </dd>
                        </>}
                        {(tx.inner_transaction && tx.inner_transaction.hash !== tx.hash) && <>
                            <dt>Inner transaction:</dt>
                            <dd>
                                <a href={tx.inner_transaction.hash}>
                                    {shortenString(tx.inner_transaction.hash, 12)}
                                </a>
                                <Info link="https://github.com/stellar/stellar-protocol/blob/master/core/cap-0015.md">
                                    The transaction that has been sponsored by this bump fee transation.</Info>
                            </dd>
                        </>}
                    </dl>
                </div>
                <dl>
                    <TxMemoView memo={tx.memo} memoType={tx.memo_type}/>
                </dl>
            </div>
            <TxPreconditionsView tx={tx}/>
            {!!embedded && <TxOperationsView tx={tx} embedded={embedded}/>}
        </div>
        {!embedded && <>
            <div className="card space">
                <TxOperationsView tx={tx} embedded={embedded}/>
            </div>
            <TxSignaturesView tx={tx}/>
        </>}
    </>
}

TxDetailsView.propTypes = {
    tx: PropTypes.object.isRequired,
    embedded: PropTypes.bool
}