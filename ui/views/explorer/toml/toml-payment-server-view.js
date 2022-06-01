import React from 'react'
import {AssetLink} from '@stellar-expert/ui-framework'

function ReceivingDetails({info, assetIssuer}) {
    const {enabled = false, minAmount, maxAmount, feeFixed, feePercent, assetCode, senderKycType, receiverKycType, fields} = info
    if (!enabled) return <>payments disabled</>
    return <div className="micro-space">
        <AssetLink asset={`${assetCode}-${assetIssuer}`}/> payments enabled
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
            {!!senderKycType && <>
                <dt>Sender KYC type:</dt>
                <dd>{senderKycType}</dd>
            </>}
            {!!receiverKycType && <>
                <dt>Receiver KYC type:</dt>
                <dd>{receiverKycType}</dd>
            </>}
        </dl>
        {Object.keys(fields).length > 0 && <div className="space">
            Fields description:
            <div className="micro-space">
                {Object.keys(fields).map(endpoint => <div key="endpoint">
                    <code>/{endpoint}</code> endpoint
                    <dl className="block-indent">
                        {Object.keys(fields[endpoint]).map(fieldName => {
                            const {choices, optional, description} = fields[endpoint][fieldName]
                            return <div key={fieldName}>
                                <code>{fieldName}</code>
                                {!!(optional || choices?.length) && <> (
                                    {!!optional && 'optional'}
                                    {choices?.length && <>
                                        {!!optional && ', '}
                                        one of {choices.map(choice => `"${choice}"`).join(', ')}
                                    </>}
                                    )</>}
                                {!!description && <> - {description}</>}
                            </div>
                        })}
                    </dl>
                </div>)}
            </div>
        </div>}
    </div>
}

export default function TomlPaymentServerView({tomlInfo, assetCode, assetIssuer}) {
    const {sep31: directPaymentServer} = tomlInfo?.interop || {}
    if (!directPaymentServer) return null
    return <>
        Direct payments server (
        <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md" rel="noreferrer noopener"
           target="_blank">SEP-0031</a> compatibility)
        <div>
            {directPaymentServer.filter(tokenInfo => !assetCode || tokenInfo.assetCode === assetCode)
                .map(info => <ReceivingDetails key={info.assetCode} {...{info, assetIssuer}}/>)}
        </div>
    </>
}