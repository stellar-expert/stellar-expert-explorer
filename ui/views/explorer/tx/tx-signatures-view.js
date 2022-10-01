import React from 'react'
import {TransactionBuilder} from 'stellar-sdk'
import {inspectTransactionSigners} from '@stellar-expert/tx-signers-inspector'
import {
    BlockSelect,
    AccountAddress,
    InfoTooltip as Info,
    useDependantState,
    findKeysBySignatureHint,
    signatureHintToMask
} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'

export default function TxSignaturesView({tx}) {
    const [{xdr, potentialSigners}, setPotentialSigners] = useDependantState(() => {
        let parsedTx = TransactionBuilder.fromXDR(tx.envelope_xdr, appSettings.networkPassphrase)
        const sourceAccount = tx.source_account
        const feeAccount = tx.fee_account

        if (tx.inner_transaction && tx.inner_transaction.hash === tx.hash) { //inner tx inside fee bump tx
            parsedTx = parsedTx.innerTransaction
        }
        //check if the source account is the only signer
        if (parsedTx.signatures.length === 1 && findKeysBySignatureHint(parsedTx.signatures[0], [sourceAccount]).length) {
            return Promise.resolve().then(() => setPotentialSigners({
                xdr: parsedTx,
                potentialSigners: [sourceAccount]
            }))
        }
        //fetch all possible transaction signers and proceed
        inspectTransactionSigners(parsedTx)
            .then(schema => {
                const potential = schema.getAllPotentialSigners();
                [sourceAccount, feeAccount].map(acc => !potential.includes(acc) && potential.push(acc))
                setPotentialSigners({xdr: parsedTx, potentialSigners: potential, prop: 1111})
            })
        return {xdr: parsedTx, potentialSigners: null, prop: 0}
    }, [tx.id])

    return <div className="card space">
        <h3>Signatures
            <Info link="https://www.stellar.org/developers/guides/concepts/multi-sig.html">The list of all
                cryptographic signatures applied to the transaction envelope. A transaction may be signed by
                up to 20 signers.</Info>
        </h3>
        <hr/>
        {!potentialSigners ?
            <div className="loader"/> :
            xdr.signatures.map(signature => {
                const sig = signature.signature().toString('base64'),
                    hint = signature.hint(),
                    possibleSigners = findKeysBySignatureHint(signature, potentialSigners)

                //TODO: we actually CAN find a signer in case of collision (extremely rare event) - just need to verify a signature using each of the candidate pubkeys
                const pubkey = possibleSigners.length !== 1 ?
                    ('Signer ' + signatureHintToMask(hint).replace(/_+/g, '____')) :
                    <AccountAddress account={possibleSigners[0]} chars={12}/>

                return <div key={sig}>
                    {pubkey}: <BlockSelect wrap inline className="word-break text-small condensed">{sig}</BlockSelect>
                </div>
            })}
    </div>
}