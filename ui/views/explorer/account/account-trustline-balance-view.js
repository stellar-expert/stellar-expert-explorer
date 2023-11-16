import React, {useCallback, useRef} from 'react'
import {parseAssetFromObject} from '@stellar-expert/asset-descriptor'
import {formatWithAutoPrecision, formatWithPrecision, stripTrailingZeros} from '@stellar-expert/formatter'
import {AssetLink, calculateAvailableBalance, useOnScreen} from '@stellar-expert/ui-framework'

export const AccountTrustlineBalanceView = React.memo(function AccountTrustlineBalanceView({account, balance, valueInfo, onClick}) {
    const root = useRef()
    const visible = useOnScreen(root)
    const asset = parseAssetFromObject(balance)
    const assetId = asset.toFQAN()
    const onBalanceClick = useCallback(() => onClick(assetId), [assetId])
    return <a href="#" className="account-balance" onClick={onBalanceClick} ref={root}>
        {visible?
            <Balance {...{account, asset, balance, valueInfo}}/>:
            <div className="account-balance">...</div>
        }
    </a>
})

function Balance({account, asset, balance, valueInfo}) {
    const estimatedValue = resolveBalanceValue(balance, valueInfo)

    return <>
        <div className="condensed">
            {stripTrailingZeros(formatWithPrecision(balance.balance))}
        </div>
        <div className="text-tiny condensed">
            {isPoolShare(balance) ?
                <>pool shares</> :
                <>{stripTrailingZeros(formatWithPrecision(calculateAvailableBalance(account, balance)))} available</>}
            {!!estimatedValue && <div>{estimatedValue}</div>}
        </div>
        <span className="text-small">
            <AssetLink asset={asset} link={false} issuer={false}/>
            {(balance.is_authorized === false && !isPoolShare(balance)) &&
                <i className="icon icon-lock" title={`Trustline to ${asset.toCurrency()} is not authorized by the asset issuer`}/>}
        </span>
    </>
}

function isPoolShare(balance) {
    return balance.asset_type === 'liquidity_pool_shares'
}

function resolveBalanceValue(balance, valueInfo) {
    if (!valueInfo || valueInfo.error || !balance)
        return
    const balanceValue = isPoolShare(balance) ?
        valueInfo.pool_stakes.find(ps => ps.pool === balance.liquidity_pool_id) :
        valueInfo.trustlines.find(ps => balance.asset_type === 'native' ?
            ps.asset === 'XLM' :
            ps.asset === parseAssetFromObject(balance).toFQAN())

    let {value} = balanceValue || {}
    if (!value)
        return '-'
    value /= 10000000
    if (value < 0.01)
        return '<0.01 ' + valueInfo.currency
    return `~${formatWithAutoPrecision(value)} ${valueInfo.currency}`
}