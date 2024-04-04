import React, {useCallback, useRef} from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithAutoPrecision, fromStroops} from '@stellar-expert/formatter'
import {AssetLink, useOnScreen} from '@stellar-expert/ui-framework'

export const AccountTrustlineBalanceView = React.memo(function AccountTrustlineBalanceView({trustline, currency, onClick}) {
    const root = useRef()
    const visible = useOnScreen(root)
    const asset = AssetDescriptor.parse(trustline.asset)
    const assetId = asset.toFQAN()
    const onBalanceClick = useCallback(() => {
        if (onClick) {
            onClick(assetId)
        }
    }, [assetId, onClick])
    return <a href="#" className="account-balance" onClick={onBalanceClick} ref={root}>
        {visible ? <Balance {...{trustline, currency}}/> : <div className="account-balance">...</div>}
    </a>
})

function Balance({trustline, currency}) {
    const estimatedValue = resolveBalanceValue(trustline, currency)
    return <>
        <div className="condensed">
            {fromStroops(trustline.balance)}
        </div>
        <div className="text-tiny condensed">
            {!!estimatedValue && <div>{estimatedValue}</div>}
        </div>
        <span className="text-small">
            <AssetLink asset={trustline.asset} link={false} issuer={false}/>
            {((trustline.flags & 1) !== 1 && !isPoolShare(trustline)) &&
                <i className="icon icon-lock" title={`Trustline to ${trustline.asset.split('-')[0]} is not authorized by the asset issuer`}/>}
        </span>
    </>
}

function isPoolShare(trustline) {
    return trustline.asset.length === 64 && !trustline.asset.includes('-')
}

function resolveBalanceValue(trustline, currency = 'USD') {
    if (!trustline)
        return
    let {value} = trustline
    if (!value)
        return '-'
    value /= 10000000
    if (value < 0.01)
        return '<0.01 ' + currency
    return `~${formatWithAutoPrecision(value)} ${currency}`
}