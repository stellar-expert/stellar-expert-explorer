import React from 'react'
import {useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AccountTrustlineBalanceView} from '../account/account-trustline-balance-view'

//TODO: unify logic with AccountCurrentBalancesView
export default withErrorBoundary(function ContractBalancesView({address, onSelectAsset}) {
    const {data: valueInfo, loaded} = useExplorerApi(`contract/${address}/value`)
    if (!loaded || !valueInfo)
        return <div className="loader"/>
    if (valueInfo?.error)
        return null
    return <>
        {!!valueInfo?.total && <div className="dimmed text-right mobile-left text-small condensed">
            <div className="desktop-only" style={{marginTop: '-2.8em'}}/>
            <span className="mobile-only">Estimated address balances value: </span>
            ~ {formatWithAutoPrecision(valueInfo.total / 10000000)} <span
            className="text-tiny">{valueInfo.currency}</span>
            <div className="desktop-only space"/>
        </div>}
        <div className="all-account-balances micro-space text-header">
            {valueInfo.balances
                .map(t => <AccountTrustlineBalanceView key={t.asset} trustline={t} currency={valueInfo.currency}
                                                       onClick={onSelectAsset}/>)}
        </div>
    </>
})