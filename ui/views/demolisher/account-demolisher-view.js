import React, {useState} from 'react'
import {StrKey, Keypair} from '@stellar/stellar-base'
import {inspectAccountSigners} from '@stellar-expert/tx-signers-inspector'
import {AccountAddress, Button, getDirectoryEntry, usePageMetadata} from '@stellar-expert/ui-framework'
import appSettings from '../../app-settings'
import Demolisher from '../../business-logic/demolisher/demolisher-tx-builder'

function filterInvalidKeyChars(value) {
    return value.replace(/\W/g, '')
}

export default function AccountDemolisherView() {
    const [status, setStatus] = useState('')
    const [errors, setErrors] = useState(null)
    const [finished, setFinished] = useState(true)
    const [balance, setBalance] = useState('')
    const [source, setSource] = useState('')
    const [destination, setDestination] = useState('')
    const [memo, setMemo] = useState('')
    const [signers, setSigners] = useState([])

    usePageMetadata({
        title: `Account demolisher for Stellar Network accounts`,
        description: `Automatic Stellar accounts merge for exchanges. Removes trustlines, open offers, and data entries.`
    })

    function resetError() {
        setErrors(null)
    }

    async function validate() {
        if (!source) return 'Source account is required.'
        if (!StrKey.isValidEd25519PublicKey(source)) return 'Invalid source account address.'
        if (!destination) return 'Destination address is required.'
        if (!StrKey.isValidEd25519PublicKey(destination)) return 'Invalid destination account address.'
        if (source === destination) return 'Destination address should not be equal to the source address.'
        if (!memo) {
            const directoryEntry = await getDirectoryEntry(destination)
            if (directoryEntry) {
                for (let mtag of ['anchor', 'issuer', 'exchange', 'distributor', 'wallet', 'custodian']) {
                    if (directoryEntry.tags.has(mtag))
                        return `Transaction memo is required for the destination [${directoryEntry.name}] ${destination}. Please check the deposit instructions.`
                }
            }
        }
        if (!signers.length) return 'Secret key for the source account is required.'
        for (let signer of signers) {
            if (!StrKey.isValidEd25519SecretSeed(signer)) return `Invalid signer secret key: ${signer}.`
        }
    }

    async function merge() {
        const validationResult = await validate()
        if (validationResult) {
            setErrors(validationResult)
            return

        }
        const {demolisher, horizon, passphrase} = appSettings.networks[appSettings.activeNetwork]

        const providedSigners = signers.map(secret => Keypair.fromSecret(secret).publicKey())
        const signersSchema = await inspectAccountSigners(source, {horizon})
        if (!signersSchema.checkFeasibility('high', providedSigners)) {
            setErrors('Not enough signatures to match the threshold. Consider adding other signers as well.')
            setFinished(true)
            return
        }

        const accountDemolisher = new Demolisher({
            endpoint: `${explorerApiOrigin}/demolisher/${appSettings.activeNetwork}`,
            mediator: demolisher,
            networkPassphrase: passphrase,
            baseFee: 200,
            horizon,
            source,
            signers,
            onStatusChange: (status, balance, finished, error) => {
                if (error) {
                    setStatus('')
                    setBalance(balance)
                    setFinished(finished)
                    setErrors(status)
                } else {
                    setStatus(status)
                    setBalance(balance)
                    setFinished(finished)
                    resetError()
                }
            }
        })

        await accountDemolisher.merge(destination, memo || undefined)
        setFinished(true)
    }

    function RenderForm() {
        if (!finished) return <div className="text-center double-space">
            <div className="loader"/>
            <div><b>Merging account <AccountAddress account={source} chars={12}/>, please wait.</b></div>
            <b>{status}&hellip;</b>
        </div>
        if (status && !errors) return <div>
            {status}
            <div className="space">
                <Button onClick={() => {
                    setStatus('')
                    setFinished(true)
                    setSource('')
                    setDestination('')
                    setMemo('')
                    setSigners([])
                    resetError()
                }}>Merge another account
                </Button>
            </div>
        </div>
        return <>
            <div className="space">
                <div>
                    <label>
                        Source
                        <span className="dimmed"> - public key (address) of your account</span>
                        <input type="text" disabled={!finished} maxLength="60" value={source}
                               onChange={e => resetError(setSource(filterInvalidKeyChars(e.target.value)))}
                               placeholder="G..."/>
                    </label>
                </div>
                <div>
                    <label>
                        Destination
                        <span className="dimmed"> - public key of the account that will receive funds</span>
                        <input type="text" disabled={!finished} value={destination} placeholder="G..." maxLength="60"
                               onChange={e => resetError(setDestination(filterInvalidKeyChars(e.target.value)))}/>
                    </label>
                </div>
                <div>
                    <label>
                        Transaction memo
                        <span className="dimmed"> - required if you are sending to an anchor or exchange</span>
                        <br/>
                        <input type="text" disabled={!finished} onChange={e => resetError(setMemo(e.target.value))}
                               value={memo} maxLength="28" style={{maxWidth: '20em'}}/>
                    </label>
                </div>
                <div>
                    <label>Secret key
                        <span className="dimmed"> - private key of your account</span>
                        {[...signers, ''].map((signer, i) => {
                            let placeholder
                            switch (i) {
                                case 0:
                                    placeholder = 'S...'
                                    break
                                case 1:
                                    placeholder = 'You can add more than one secret key if needed'
                                    break
                                default:
                                    placeholder = 'You can add one more secret key if needed'
                            }
                            return <div key={i}>
                                <input type="text" disabled={!finished} value={signer} maxLength="60"
                                       placeholder={placeholder} onChange={e => {
                                    const newSigners = signers.slice()
                                    newSigners[i] = filterInvalidKeyChars(e.target.value.trim())
                                    resetError(setSigners(newSigners.filter(s => !!s)))
                                }}/>
                            </div>
                        })}
                        {signers.length < 1 &&
                            <div className="dimmed text-small">You can add more than one secret key for multisig-protected
                                accounts</div>}
                    </label>
                </div>
            </div>
            {!!errors && <div className="space error" style={{padding: '0.5em 1em'}}>Error: {errors}</div>}
            {!!finished && <div className="actions double-space row">
                <div className="column column-25">
                    <Button block onClick={merge}>Merge account</Button>
                </div>
            </div>}
        </>
    }

    return <div className="container narrow">
        <h2>Account Demolisher</h2>
        <div className="segment blank">
            <p>
                Every Stellar account must maintain a minimum balance (currently 1 XLM) to exist on the ledger.
                Moreover, each asset trustline, open DEX offer, additional signer, and data entry requires
                an additional 0.5 XLM reserve.
                This tool provides a straightforward way to merge Stellar accounts automatically.
            </p>
            <ul className="list checked space">
                <li>Automatically closes open offers.</li>
                <li>Automatically sells owned assets on Stellar DEX at market price.</li>
                <li>Automatically removes trustlines, returning all unsold assets to the issuers.</li>
                <li>Automatically removes existing data entries.</li>
                <li>Allows merging directly to exchanges and other destinations that do not support merge
                    operations out of the box.
                </li>
                <li>Works with multisig accounts.</li>
                <li>Absolutely free, you pay only for transaction fees.</li>
            </ul>
        </div>
        <div className="space segment blank">
            {RenderForm()}
        </div>
    </div>
}