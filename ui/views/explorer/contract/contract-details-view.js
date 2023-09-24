import React from 'react'
import {AssetLink, AccountAddress, CopyToClipboard} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'

export default function ContractDetailsView({contract}) {
    if (!contract)
        return <div className="loader"/>
    return <div>
        <dl>
            <ContractType contract={contract}/>
            <dt>Creator:</dt>
            <dd><AccountAddress account={contract.creator}/></dd>
            {contract.payments > 0 && <>
                <dt>Payments:</dt>
                <dd>{contract.payments}</dd>
            </>}
            {contract.trades > 0 && <>
                <dt>Trades:</dt>
                <dd>{contract.trades}</dd>
            </>}
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