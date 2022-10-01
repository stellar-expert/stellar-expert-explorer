import React from 'react'
import {InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'

function prepareOpData(op) {
    let data = {}
    switch (op.type_i) {
        case 0:
            data.title = 'CreateAccount'
            data.info = <Info
                link="https://developers.stellar.org/docs/start/list-of-operations/#create-account">
                <p>
                    This operation creates and funds a new account with the specified starting balance.
                </p>
                <p>
                    Threshold: Medium
                </p>
            </Info>
            break
        case 1:
            data.title = 'Payment'
            data.info = <Info link="https://developers.stellar.org/docs/start/list-of-operations/#payment">
                <p>
                    Sends an amount in a specific asset to a destination account.
                </p>
                <p>
                    Threshold: Medium
                </p>
            </Info>
            break
        case 2:
            data.title = 'PathPaymentStrictReceive'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#path-payment">
                    <p>
                        Sends an amount in a specific asset to a destination account through a path of offers. This
                        allows the asset sent to be different from the asset received.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 3:
        case 4:
        case 12:
            switch (op.type_i) {
                case 3:
                    data.title = 'ManageSellOffer'
                    break
                case 4:
                    data.title = 'CreatePassiveSellOffer'
                    break
                case 12:
                    data.title = 'ManageBuyOffer'
                    break
            }
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#manage-offer">
                    <p>
                        Creates, updates, or deletes an offer on Stellar DEX.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 5:
            data.title = 'SetAccountOptions'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#set-options">
                    <p>
                        This operation sets the options for an account.
                    </p>
                    <p>
                        Threshold: Medium or High (when updating signers or other thresholds, the threshold of this
                        operation is high)
                    </p>
                </Info>
            break
        case 6:
            data.title = 'ChangeTrust'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#change-trust">
                    <p>
                        Creates, updates, or deletes a trustline to an asset.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 7:
            data.title = 'AllowTrust'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#allow-trust">
                    <p>
                        Updates the <code>authorized</code> flag of an existing trustline. This can only be called by
                        the issuer of a trustline’s asset.
                    </p>
                    <p>
                        The issuer can only clear the <code>authorized</code> flag if the issuer has
                        the <code>AUTH_REVOCABLE_FLAG</code> set. Otherwise, the issuer can only set
                        the <code>authorized</code> flag.</p>
                    <p>
                        Threshold: Low
                    </p>
                </Info>
            break
        case 8:
            data.title = 'AccountMerge'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#account-merge">
                    <p>
                        Transfers the native balance (the amount of XLM an account holds) to another account and removes
                        the source account from the ledger.
                    </p>
                    <p>
                        Threshold: High
                    </p>
                </Info>
            break
        case 9:
            data.title = 'Inflation'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#inflation">
                    <p>
                        This operation runs inflation.
                    </p>
                    <p>
                        Threshold: Low
                    </p>
                </Info>
            break
        case 10:
            data.title = 'ManageData'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#manage-data">
                    <p>
                        Allows to set, modify or delete a Data Entry (name/value pair) that is attached to a
                        particular account. An account can have an arbitrary amount of DataEntries attached to it. Each
                        DataEntry increases the minimum balance needed to be held by the account.
                    </p>
                    <p>
                        DataEntries can be used for application specific things. They are not used by the core Stellar
                        protocol.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 11:
            data.title = 'BumpSequence'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#bump-sequence">
                    <p>
                        Bumps forward the sequence number of the source account of the operation,
                        allowing it to invalidate any transactions with a smaller sequence number.
                    </p>
                    <p>
                        Threshold: Low
                    </p>
                </Info>
            break
        case 13:
            data.title = 'PathPaymentStrictSend'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#path-payment">
                    <p>
                        Sends an amount in a specific asset to a destination account through a path of offers. This
                        allows the asset sent to be different from the asset received.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 14:
            data.title = 'CreateClaimableBalance'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#create-claimable-balance">
                    <p>
                        Creates a <a href="https://developers.stellar.org/docs/glossary/claimable-balance/"
                                     target="_blank">ClaimableBalanceEntry</a> that splits a payment into two parts
                        with separate claiming conditions.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 15:
            data.title = 'ClaimClaimableBalance'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#claim-claimable-balance">
                    <p>
                        Claims a <a href="https://developers.stellar.org/docs/glossary/claimable-balance/"
                                    target="_blank">ClaimableBalanceEntry</a> and adds the amount of asset on the entry
                        to the source account.
                    </p>
                    <p>
                        Threshold: Low
                    </p>
                </Info>
            break
        case 16:
            data.title = 'BeginSponsoringFutureReserves'
            data.info =
                <Info
                    link="https://developers.stellar.org/docs/start/list-of-operations/#begin-sponsoring-future-reserves">
                    <p>
                        Establishes the is-sponsoring-future-reserves-for relationship between the source account and
                        sponsoredID. See <a href="https://developers.stellar.org/docs/glossary/sponsored-reserves/"
                                            target="_blank">Sponsored Reserves</a> for more information.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 17:
            data.title = 'EndSponsoringFutureReserves'
            data.info =
                <Info
                    link="https://developers.stellar.org/docs/start/list-of-operations/#end-sponsoring-future-reserves">
                    <p>
                        Terminates the current is-sponsoring-future-reserves-for relationship in which the source
                        account is sponsored. See{' '}
                        <a href="https://developers.stellar.org/docs/glossary/sponsored-reserves/"
                           target="_blank">Sponsored Reserves</a> for more information.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 18:
            data.title = 'RevokeSponsorship'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#revoke-sponsorship">
                    <p>
                        If the source account is not sponsored or is sponsored by the owner of the specified entry or
                        sub-entry, then attempt to revoke the sponsorship. If the source account is sponsored, the next
                        step depends on whether the entry is sponsored or not. If it is sponsored, attempt to transfer
                        the sponsorship to the sponsor of the source account. If the entry is not sponsored, then
                        establish the sponsorship.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 19:
            data.title = 'Clawback'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#clawback">
                    <p>
                        Performs asset clawback, retrieving a specified amount of revocable asset from a user's account.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 20:
            data.title = 'ClawbackClaimClaimableBalance'
            data.info =
                <Info
                    link="https://developers.stellar.org/docs/start/list-of-operations/#clawback-claim-claimable-balance">
                    <p>
                        Performs claimable balance clawback, returning the entire clawback amount to the issuer address.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 21:
            data.title = 'SetTrustLineFlags'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#set-trustline-flags">
                    <p>
                        Updates trustline authorization flags for an asset that requires authorization.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 22:
            data.title = 'LiquidityPoolDeposit'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#liquidity-pool-deposit">
                    <p>
                        Deposits assets into a liquidity pool. Depositing increases the reserves of a liquidity pool in
                        exchange for pool shares.
                    </p>
                    <p>
                        If the pool is empty, then this operation deposits maxAmountA of A and maxAmountB of B into the
                        pool. If the pool is not empty, then this operation deposits at most maxAmountA of A and
                        maxAmountB of B into the pool. The actual amounts deposited are determined using the current
                        reserves of the pool.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
        case 23:
            data.title = 'LiquidityPoolWithdraw'
            data.info =
                <Info link="https://developers.stellar.org/docs/start/list-of-operations/#liquidity-pool-withdraw">
                    <p>
                        Withdraw assets from a liquidity pool. Withdrawing reduces the number of pool shares in exchange
                        for reserves from a liquidity pool.
                    </p>
                    <p>
                        Threshold: Medium
                    </p>
                </Info>
            break
    }
    return data
}

export default function OperationDetailsHeader({operation, txLink = false}) {
    const data = prepareOpData(operation)
    const res = <span>Operation {operation.id} - {data.title}</span>
    if (txLink) return <a href={resolvePath('op/' + operation.id)}>{res}</a>
    return res
}