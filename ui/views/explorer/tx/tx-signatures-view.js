import React from 'react'
import {inspectTransactionSigners} from '@stellar-expert/tx-signers-inspector'
import {
    BlockSelect,
    AccountAddress,
    InfoTooltip as Info,
    useDependantState,
    findKeysBySignatureHint,
    signatureHintToMask
} from '@stellar-expert/ui-framework'

export default function TxSignaturesView({parsedTx}) {
    const [{xdr, potentialSigners}, setPotentialSigners] = useDependantState(() => {
        let {tx} = parsedTx
        let feeAccount = tx.source

        if (tx.innerTransaction) { //inner tx inside a fee bump tx
            feeAccount = tx.feeSource
            tx = tx.innerTransaction
        }
        const sourceAccount = tx.source
        //check if the source account is the only signer
        if (tx.signatures.length === 1 && findKeysBySignatureHint(tx.signatures[0], [sourceAccount]).length) {
            return Promise.resolve().then(() => setPotentialSigners({
                xdr: tx,
                potentialSigners: [sourceAccount]
            }))
        }
        //fetch all possible transaction signers and proceed
        inspectTransactionSigners(tx)
            .then(schema => {
                const potential = schema.getAllPotentialSigners();
                [sourceAccount, feeAccount].map(acc => !potential.includes(acc) && potential.push(acc))
                setPotentialSigners({xdr: tx, potentialSigners: potential})
            })
        return {xdr: tx, potentialSigners: null, prop: 0}
    }, [parsedTx.id])

    return <div className="segment blank space">
        <h3>Signatures
            <Info link="https://www.stellar.org/developers/guides/concepts/multi-sig.html">The list of all
                cryptographic signatures applied to the transaction envelope. A transaction may be signed by
                up to 20 signers.</Info>
        </h3>
        <hr className="flare"/>
        {!potentialSigners ?
            <div className="loader"/> :
            xdr.signatures.map(signature => {
                const sig = signature.signature().toString('base64')
                const hint = signature.hint()
                const possibleSigners = findKeysBySignatureHint(signature, potentialSigners)

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