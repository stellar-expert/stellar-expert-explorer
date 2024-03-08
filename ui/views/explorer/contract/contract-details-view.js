import React from 'react'
import {AssetLink, AccountAddress, CopyToClipboard, UtcTimestamp, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import ContractStorageInfo from '../../components/contract-storage-info'

export default function ContractDetailsView({contract}) {
    if (!contract)
        return <div className="loader"/>
    return <div>
        <dl>
            <ContractType contract={contract}/>
            <ContractValidationStatus validation={contract.validation}/>
            <dt>Creator:</dt>
            <dd><AccountAddress account={contract.creator}/></dd>
            <dt>Created:</dt>
            <dd><UtcTimestamp date={contract.created}/></dd>
            {contract.payments > 0 && <>
                <dt>Payments:</dt>
                <dd>{contract.payments}</dd>
            </>}
            {contract.trades > 0 && <>
                <dt>Trades:</dt>
                <dd>{contract.trades}</dd>
            </>}
            <ContractStorageInfo stats={contract}/>
        </dl>
    </div>
}

function ContractType({contract}) {
    if (contract.wasm)
        return <>
            <dt>Type:</dt>
            <dd>WASM contract</dd>
            <dt>Hash:</dt>
            <dd>{shortenString(contract.wasm, 16)}<CopyToClipboard text={contract.wasm}/></dd>
        </>
    if (contract.asset)
        return <>
            <dt>Type:</dt>
            <dd>Contract from asset</dd>
            <dt>Anchored asset:</dt>
            <dd><AssetLink asset={contract.asset}/></dd>
        </>
    if (contract.issuer)
        return <>
            <dt>Type:</dt>
            <dd>Contract from address</dd>
            <dt>Issuer address:</dt>
            <dd><AccountAddress account={contract.issuer}/></dd>
            <dt>Salt:</dt>
            <dd>{shortenString(contract.salt, 16)}<CopyToClipboard text={contract.salt}/></dd>
        </>
    return <>
        <dt>Type:</dt>
        <dd>Unknown</dd>
    </>
}

function ContractValidationStatus({validation}) {
    if (!validation)
        return null
    const {status, source, possibleSource} = validation
    return <>
        <dt>Source code:</dt>
        {status === 'unverified' ? <dd>
            Unavailable - <a href={location.pathname + '/validate'}><i className="icon-add-circle"/>Provide source code</a>
        </dd> : source ? <dd>
            <a href={source} target="_blank" rel="noreferrer"><i className="icon-github"/>{parseSourceRepo(source)}</a> - confirmed
        </dd> : <dd>
            <i className="icon-warning-circle"/>Verification {status}
            <Info>
                <a href={possibleSource} target="_blank" rel="noreferrer">Contract code</a> validation for this contract has been requested.
                If the process fails, you will be able to resubmit the validation request in an hour.
            </Info>
        </dd>}
    </>
}

function parseSourceRepo(source) {
    const [_, owner, repo] = /github.com\/(.*?)\/(.*?)\//.exec(source.toLowerCase())
    if (!owner || !repo)
        return 'repository'
    return owner + '/' + repo
}