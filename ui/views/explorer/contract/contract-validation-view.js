import React, {useCallback, useRef, useState} from 'react'
import {AccountAddress, Button, formatExplorerLink} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import {useParams} from 'react-router'
import {useContractInfo} from '../../../business-logic/api/contract-api'
import {apiCall} from '../../../models/api'
import TurnstileCaptcha from '../../components/turnstile-captcha'
import appSettings from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'

export default function ContractValidationView() {
    const {id: address} = useParams()
    setPageMetadata({
        title: `Contract Validation ${address}`,
        description: `Submit source code validation request for the contract ${address}.`
    })
    return <div>
        <h2 className="condensed word-break">
            <span className="dimmed">Contract Code Validation</span> <AccountAddress account={address} chars="all"/>
        </h2>
        <ContractValidationForm address={address}/>
    </div>
}

function ContractValidationForm({address}) {
    const {loaded, data} = useContractInfo(address)
    const [sourceLink, setSourceLink] = useState('')
    const [inProgress, setInProgress] = useState(false)
    const updateSourceLink = useCallback(e => setSourceLink(e.target.value.trim()), [])
    const captchaRef = useRef()
    const requestVerification = useCallback(async function () {
        const sourceWarning = validateSource(sourceLink)
        if (sourceWarning)
            return notify({
                type: 'warning',
                message: sourceWarning
            })

        try {
            setInProgress(true)
            //initialize anti-bot challenge
            const captcha = captchaRef.current
            captcha.execute()
            const antiBotToken = await new Promise((resolve, reject) => setTimeout(() => {
                //retrieve challenge result
                const token = captcha.getResponse()
                if (!token) {
                    notify({
                        type: 'warning',
                        message: 'Failed to pass anti-bot verification test'
                    })
                    return reject()
                }
                //all good, token obtained
                resolve(token)
            }, 4000))
            try {
                const validationStatus = await apiCall(`contract-validation/validate`, {
                    contract: address,
                    source: sourceLink,
                    antiBotToken
                }, {method: 'POST'})
                if (validationStatus.status === 'pending') {
                    notify({
                        type: 'success',
                        message: 'Contract source code validation request submitted. Please wait for the verification result.'
                    })
                }
                console.log(validationStatus)
                setTimeout(() => navigation.navigate(), 2000)
                setSourceLink('')
            } catch (e) {
                notify({
                    type: 'error',
                    message: e.ext?.error || 'Internal error while submitting validation request.'
                })
            }
        } catch (e) {
            console.error(e)
            notify({
                type: 'error',
                message: e.ext?.error || 'Internal error occurred.'
            })
        } finally {
            setInProgress(false)
        }

    }, [address, sourceLink])

    if (!loaded)
        return <div className="segment blank">
            <div className="text-center">
                <div className="loader"/>
                <div className="dimmed text-tiny">Loading contract properties</div>
            </div>
        </div>

    if (!data)
        return <div className="segment blank">
            <div className="segment error space">
                <i className="icon icon-warning"/> Contract {address} not found on the ledger
            </div>
        </div>

    if (data.validation?.status === 'verified')
        return <div className="segment blank">
            <div className="segment warning space">
                <i className="icon icon-info"/> Contract {address} is already associated with the{' '}
                <a href={data.validation?.source} target="_blank" rel="noreferrer">source code repository</a>.
            </div>
        </div>

    const disabled = inProgress || (data.validation?.status === 'pending' && (data.validation.ts + 10 * 60) * 1000 > new Date().getTime())

    return <div className="segment blank">
        <div className="dimmed text-small">
            Contract developers can request source code verification of the contract. This procedure is automatic, it matches the
            hash of the smart contract compiled from sources with the hash of the contract deployed on the ledger. Upon successful
            verification, all users will be able to see the associated Github repository link and check the original contract code.
            Service provided in the collaboration with <a href="https://www.sorobanexp.com/" target="_blank">sorobanexp.com</a>.
        </div>
        <label className="double-space">
            <div>
                Github repository address of the contract source code
            </div>
            <input type="text" onChange={updateSourceLink} value={sourceLink} maxLength={300} disabled={disabled}
                   placeholder="e.g. https://github.com/stellar/soroban-examples/tree/c7947120dc3ef92345d6e019737065d916cfae9d/cross_contract/contract_a"/>
        </label>
        <div className="text-tiny dimmed">
            <i className="icon-warning-circle"/>{' '}
            Please make sure that you copy-pasted HTTPS repository link containing the commit hash to associate the contract WASM with the
            particular point-in-time snapshot of the source code. Primary reason why commit hash is required is that any other bookmark
            (branch or tag name) can be updated after the successful validation, breaking the chain of trust.
        </div>
        <TurnstileCaptcha ref={captchaRef} sitekey={appSettings.turnstileKey}/>
        <div className="row space">
            <div className="column column-50">
                {inProgress && <div className="loader inline micro"/>}
                {!!data.validation && !inProgress && data.validation.status !== 'unverified' && <>
                    <i className="icon-puzzle"/> <a href={data.validation.possibleSource} target="_blank" rel="noreferrer">Source code</a>
                    {' '}validation {data.validation.status}
                </>}
            </div>
            <div className="column column-50">
                <Button block onClick={requestVerification} disabled={disabled}>Validate source code</Button>
            </div>
        </div>
    </div>
}

function validateSource(sourceLink) {
    if (!sourceLink)
        return 'Please provide URL of the repository containing the contract source code'
    if (!sourceLink.startsWith('https://github.com/'))
        return 'Only Github repositories are supported at the moment'
    if (!/\/tree\/[a-f0-9]{40}\//.test(sourceLink))
        return 'Repository link should contain the commit hash to associate the contract WASM with the particular point-in-time snapshot of the source code'
}