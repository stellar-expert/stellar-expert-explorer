import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import {AccountTrustlineBalanceView} from './account-trustline-balance-view'
import './account-balances.scss'

export default withErrorBoundary(function AccountCurrentBalancesView({account, onSelectAsset}) {
    const {address, deleted} = account
    const {data: valueInfo} = useExplorerApi(`account/${address}/value`)
    if (deleted)
        return <div className="dimmed space">Balances unavailable</div>
    if (!valueInfo || valueInfo?.error)
        return null
    return <>
        {!!valueInfo?.total && <div className="dimmed text-right mobile-left text-small condensed">
            <div className="desktop-only" style={{marginTop: '-2.8em'}}/>
            <span className="mobile-only">Estimated account balances value: </span>
            ~ {formatWithAutoPrecision(valueInfo.total / 10000000)} <span className="text-tiny">{valueInfo.currency}</span>
            <div className="desktop-only space"/>
        </div>}
        <div className="all-account-balances micro-space text-header">
            {valueInfo.balances
                .map(t => <AccountTrustlineBalanceView key={t.asset} trustline={t} currency={valueInfo.currency} onClick={onSelectAsset}/>)}
        </div>
    </>
})