import React from 'react'
import {AssetLink, AccountAddress, CopyToClipboard, UtcTimestamp, formatExplorerLink} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import ContractStorageInfo from '../../components/contract-storage-info'
import ContractCodeValidationStatusView from './contract-code-validation-status-view'

export default function ContractDetailsView({contract}) {
    if (!contract)
        return <div className="loader"/>
    return <div>
        <dl>
            <ContractType contract={contract}/>
            <ContractCodeValidationStatusView validation={contract.validation}/>
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
            {contract.versions > 0 && <>
                <dt>Versions:</dt>
                <dd><a href={formatExplorerLink('contract', contract.address + '/versions')}>{contract.versions}</a></dd>
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
            <dd>Contract from asset <AssetLink asset={contract.asset}/></dd>
        </>
    if (contract.issuer)
        return <>
            <dt>Type:</dt>
            <dd>Contract from address <AccountAddress account={contract.issuer}/></dd>
            <dt>Salt:</dt>
            <dd>{shortenString(contract.salt, 16)}<CopyToClipboard text={contract.salt}/></dd>
        </>
    return <>
        <dt>Type:</dt>
        <dd>Unknown</dd>
    </>
}