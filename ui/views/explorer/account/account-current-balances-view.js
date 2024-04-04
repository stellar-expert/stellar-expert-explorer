import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import {AccountTrustlineBalanceView} from './account-trustline-balance-view'
import './account-balances.scss'

export default withErrorBoundary(function AccountCurrentBalancesView({account, onSelectAsset}) {
    const {address, ledgerData, deleted} = account
    const {data: valueInfo} = useExplorerApi(`account/${address}/value`)
    if (deleted)
        return <div className="dimmed space">Balances unavailable</div>
    if (!valueInfo)
        return null
    const xlmTrustline = valueInfo.trustlines.find(t => t.asset === 'XLM')
    return <>
        {!!valueInfo?.total && <div className="dimmed text-right mobile-left text-small condensed">
            <div className="desktop-only" style={{marginTop: '-2.8em'}}/>
            <span className="mobile-only">Estimated account balances value: </span>
            ~ {formatWithAutoPrecision(valueInfo.total / 10000000)} <span className="text-tiny">{valueInfo.currency}</span>
            <div className="desktop-only space"/>
        </div>}
        <div className="all-account-balances micro-space text-header">
            <AccountTrustlineBalanceView key="xlm" account={ledgerData} trustline={xlmTrustline} onClick={onSelectAsset}/>
            {valueInfo.trustlines
                .filter(t => t.asset !== 'XLM')
                .map(t => <AccountTrustlineBalanceView key={getUniqueKey(t)} trustline={t} currency={valueInfo.currency} onClick={onSelectAsset}/>)}
        </div>
    </>
})

function isPoolShare(balance) {
    return balance.asset_type === 'liquidity_pool_shares'
}

function getUniqueKey(balance) {
    return isPoolShare(balance) ?
        balance.liquidity_pool_id :
        balance.asset_type + balance.asset_code + balance.asset_issuer
}