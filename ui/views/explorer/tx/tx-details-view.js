import React from 'react'
import {
    BlockSelect,
    AccountAddress,
    Amount,
    UtcTimestamp,
    InfoTooltip as Info,
    TxOperationsList,
    parseTxDetails, withErrorBoundary
} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import appSettings from '../../../app-settings'
import {resolvePath} from '../../../business-logic/path'
import TxSignaturesView from './tx-signatures-view'
import TxMemoView from './tx-memo-view'
import TxHeaderView from './tx-header-view'
import TxPreconditionsView from './tx-preconditions-view'

/**
 * @param {{}} tx
 * @param {Boolean} embedded
 * @return {JSX.Element}
 */
export default withErrorBoundary(function TxDetailsView({tx, embedded}) {
    const parsedTx = parseTxDetails({
        network: appSettings.networkPassphrase,
        txEnvelope: tx.body,
        result: tx.result,
        meta: tx.meta,
        createdAt: tx.ts,
        context: {},
        protocol: tx.protocol
    })
    let feeSource
    let {tx: transaction} = parsedTx
    if (transaction.innerTransaction) {
        feeSource = transaction.feeSource
        transaction = transaction.innerTransaction
    } else {
        feeSource = transaction.source
    }
    const source = transaction.source
    const memo = transaction.memo
    const feeEffect = parsedTx.effects.find(e => e.type === 'feeCharged')
    return <>
        <TxHeaderView tx={tx} embedded={embedded}/>
        <div className="segment blank">
            <h3>Summary</h3>
            <hr className="flare"/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Status:</dt>
                        <dd>
                            {parsedTx.successful ?
                                <><i className="icon icon-ok dimmed"/><BlockSelect>Successful</BlockSelect></> :
                                <><i className="icon icon-block dimmed"/><BlockSelect>Failed</BlockSelect></>}
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html">Whether
                                the transaction has been applied to the ledger or failed upon submission.</Info>
                        </dd>
                        <dt>Ledger:</dt>
                        <dd>
                            <a href={resolvePath('ledger/' + tx.ledger)}>{tx.ledger}</a>
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
                            <BlockSelect inline className="condensed">{transaction.sequence}</BlockSelect>
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
                            <UtcTimestamp date={tx.ts}/>
                            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html#ledger-header">
                                Enclosing ledger timestamp.</Info>
                        </dd>
                        <dt>Max Fee:</dt>
                        <dd>
                            <BlockSelect><Amount asset="XLM" amount={feeEffect.bid} adjust issuer={false}/></BlockSelect>
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html#fee">Maximum
                                fee specified in the transaction itself – the maximum XLM amount the source account
                                willing to pay. Each transaction sets a fee that is paid by the source account. The more
                                operations in the transaction, the greater the required fee.</Info>
                        </dd>
                        <dt>Fee Charged:</dt>
                        <dd>
                            <BlockSelect><Amount asset="XLM" amount={feeEffect.charged} adjust issuer={false}/></BlockSelect>
                            <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html#fee">Actually
                                charged fee which can be lower than the fee specified in the transaction. Each
                                transaction sets a fee that is paid by the source account. The more operations in the
                                transaction, the greater the required fee.</Info>
                        </dd>
                        {feeSource !== source && <>
                            <dt>Fee Source Account:</dt>
                            <dd>
                                <AccountAddress account={feeEffect.source} chars={12}/>
                                <Info link="https://github.com/stellar/stellar-protocol/blob/master/core/cap-0015.md">
                                    The address of the account that paid fee on behalf of the source account for this
                                    transaction.</Info>
                            </dd>
                        </>}
                        {!!parsedTx.tx.innerTransaction && <>
                            <dt>Inner transaction:</dt>
                            <dd>
                                <a href={transaction.hash().toString('hex')}>
                                    {shortenString(transaction.hash().toString('hex'), 12)}
                                </a>
                                <Info link="https://github.com/stellar/stellar-protocol/blob/master/core/cap-0015.md">
                                    The transaction that has been sponsored by this bump fee transaction.</Info>
                            </dd>
                        </>}
                    </dl>
                </div>
                {!!memo && <dl>
                    <TxMemoView memo={memo.value} memoType={memo.type}/>
                </dl>}
            </div>
            {<TxPreconditionsView parsedTx={parsedTx}/>}
            {!!embedded && <div className="micro-space"><TxOperationsList parsedTx={parsedTx}/></div>}
        </div>
        {!embedded && <>
            <div className="segment blank space">
                <TxOperationsList parsedTx={parsedTx}/>
            </div>
            <TxSignaturesView parsedTx={parsedTx}/>
        </>}
    </>
})