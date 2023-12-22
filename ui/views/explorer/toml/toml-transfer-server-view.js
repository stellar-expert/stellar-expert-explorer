import React from 'react'
import {Keypair} from '@stellar/stellar-base'
import {AssetLink} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'

function buildSep24DemoUrl({assetCode, assetIssuer}) {
    const params = {
        untrustedAssets: `${assetCode}:${assetIssuer}`,
        secretKey: Keypair.random().secret(),
        pubnet: appSettings.activeNetwork === 'public'
    }
    return `https://demo-wallet.stellar.org/account/?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`
}

function TransferMethodDetails({info, assetIssuer}) {
    const {
        enabled = false,
        authenticationRequired,
        minAmount,
        maxAmount,
        feeFixed,
        feePercent,
        method,
        assetCode
    } = info
    if (!enabled) return <><code>/{method}</code> endpoint disabled</>
    return <div className="micro-space">
        <AssetLink asset={`${assetCode}-${assetIssuer}`}/> <code>/{method}</code> endpoint enabled
        {authenticationRequired && ', authentication required'}
        <dl>
            {minAmount > 0 && <>
                <dt>Min amount:</dt>
                <dd>{minAmount} {assetCode}</dd>
            </>}
            {maxAmount > 0 && <>
                <dt>Max amount:</dt>
                <dd>{maxAmount} {assetCode}</dd>
            </>}
            {feeFixed > 0 && <>
                <dt>Fixed fee:</dt>
                <dd>{feeFixed} {assetCode}</dd>
            </>}
            {feePercent > 0 && <>
                <dt>Percent fee:</dt>
                <dd>{feePercent}%</dd>
            </>}
        </dl>
    </div>
}

function TransferEndpointDetails({endpoint, info}) {
    return <div>
        <code>/{endpoint}</code> endpoint {info.enabled ? 'enabled' : 'disabled'}{info.authRequired && ', authentication required'}
    </div>
}

function mapTransfersInfo(transferServer, assetCodeFilter) {
    const res = []
    for (let method of ['deposit', 'withdraw']) {
        const methodGroup = transferServer[method]
        if (methodGroup) {
            for (let assetCode of Object.keys(methodGroup)) {
                if (assetCodeFilter && assetCode !== assetCodeFilter) continue
                res.push({method, ...methodGroup[assetCode]})
            }
        }
    }
    return res
}

export default function TomlTransferServerView({tomlInfo, standard, assetCode, assetIssuer}) {
    const transferServer = (tomlInfo?.interop || {})[standard]
    if (!transferServer) return null
    const {endpoints = {}} = transferServer
    return <>
        <div className="dimmed text-tiny">
            Please note, the metadata is loaded from the account home domain and was
            not verified by StellarExpert team.
        </div>
        <div className="micro-space">
            {standard === 'sep24' ?
                <>Interactive Transfer Server (
                    <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md"
                       target="_blank" rel="noreferrer noopener">SEP-0024</a> compatibility)
                </> :
                <>Transfer Server (
                    <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md"
                       target="_blank" rel="noreferrer noopener">SEP-0006</a> compatibility)
                </>}
        </div>
        <div>
            {mapTransfersInfo(transferServer, assetCode).map(info => <TransferMethodDetails
                key={info.assetCode + info.method} info={info} {...{assetIssuer}}/>)}
        </div>
        {Object.keys(endpoints).length && <div className="micro-space">
            {Object.keys(endpoints).map(endpoint => <TransferEndpointDetails key={endpoint} endpoint={endpoint}
                                                                             info={endpoints[endpoint]}/>)}
        </div>}
        <div className="micro-space">
            <a href={buildSep24DemoUrl({assetCode, assetIssuer})}
               target="_blank" rel="noreferrer noopener">Try transfer server <i className="icon icon-export"/></a>
        </div>
    </>
}