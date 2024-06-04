import React from 'react'
import {useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AccountTrustlineBalanceView} from '../account/account-trustline-balance-view'

export default withErrorBoundary(function ContractBalancesView({address}) {
    const {data, loaded} = useExplorerApi(`contract/${address}/value`)
    if (!loaded)
        return <div className="loader"/>
    if (!data?.trustlines.length)
        return <div className="dimmed space text-center text-small">Balances unavailable</div>
    const total = (data.total || 0) / 10000000
    return <>
        {total > 0.1 && <div className="dimmed text-right mobile-left text-small condensed">
            <div className="desktop-only" style={{marginTop: '-2.8em'}}/>
            <span className="mobile-only">Estimated contract balances value: </span>
            ~ {formatWithAutoPrecision(total)} <span className="text-tiny">{data.currency}</span>
            <div className="desktop-only space"/>
        </div>}
        <div className="all-account-balances micro-space text-header">
            {data.trustlines.map(t => <AccountTrustlineBalanceView key={t.asset} currency={data.currency} trustline={t}/>)}
        </div>
    </>
})