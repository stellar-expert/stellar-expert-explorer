import React from 'react'
import {parseAssetFromObject} from '@stellar-expert/asset-descriptor'
import {stripTrailingZeros, formatWithPrecision, formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AssetLink, calculateAvailableBalance, useExplorerApi} from '@stellar-expert/ui-framework'
import './account-balances.scss'

function isPoolShare(balance) {
    return balance.asset_type === 'liquidity_pool_shares'
}

function getUniqueKey(balance) {
    return isPoolShare(balance) ?
        balance.liquidity_pool_id :
        balance.asset_type + balance.asset_code + balance.asset_issuer
}

function resolveBalanceValue(balance, valueInfo) {
    if (!valueInfo || valueInfo.error || !balance) return
    const balanceValue = isPoolShare(balance) ?
        valueInfo.pool_stakes.find(ps => ps.pool === balance.liquidity_pool_id) :
        valueInfo.trustlines.find(ps => balance.asset_type === 'native' ?
            ps.asset === 'XLM' :
            ps.asset === parseAssetFromObject(balance).toFQAN())

    let {value} = balanceValue || {}
    if (!value) return '-'
    value /= 10000000
    if (value < 0.01) return '<0.01 ' + valueInfo.currency
    return `~${formatWithAutoPrecision(value)} ${valueInfo.currency}`
}

function AccountBalanceView({account, balance, valueInfo, onClick}) {
    const asset = parseAssetFromObject(balance)
    const estimatedValue = resolveBalanceValue(balance, valueInfo)

    return <div>
        <span onClick={() => onClick(asset.toFQAN())}>
            <AssetLink asset={asset} className="account-balance text-center" link="#">
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
                    <AssetLink asset={asset} link={false} issuer={false} displayIssuer={false}/>
                    {(balance.is_authorized === false && !isPoolShare(balance)) &&
                        <i className="icon icon-lock" title={`Trustline to ${asset.toCurrency()} is not authorized by the asset issuer`}/>}
                </span>
            </AssetLink>
        </span>
    </div>
}

export default function AccountCurrentBalancesView({account, onSelectAsset}) {
    const {address, ledgerData, deleted} = account
    const {data: valueInfo} = useExplorerApi(`account/${address}/value`)
    if (deleted) return <div className="dimmed">Balances unavailable</div>
    if (!ledgerData) return null
    const xlmBalance = ledgerData.balances.find(b => b.asset_type === 'native')
    return <>
        {!!valueInfo?.total && <div className="dimmed text-right" style={{marginTop: '-2.5em'}}>
            ~{formatWithAutoPrecision(valueInfo.total / 10000000)} USD
        </div>}
        <div className="all-account-balances text-header micro-space">
            <AccountBalanceView key="xlm" account={ledgerData} balance={xlmBalance} valueInfo={valueInfo} onClick={onSelectAsset}/>
            {ledgerData.balances
                .filter(b => b.asset_type !== 'native')
                .map(b => <AccountBalanceView key={getUniqueKey(b)} account={ledgerData} balance={b} valueInfo={valueInfo}
                                              onClick={onSelectAsset}/>)}
        </div>
    </>
}