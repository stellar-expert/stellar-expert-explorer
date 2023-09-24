import React, {useCallback} from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {AssetLink, useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import {stripTrailingZeros, formatWithPrecision, formatWithAutoPrecision} from '@stellar-expert/formatter'

//TODO: merge with account balances
function ContractBalanceView({trustline, onClick}) {
    const asset = AssetDescriptor.parse(trustline.asset).toFQAN()
    const onBalanceClick = useCallback(() => onClick && onClick(asset), [asset, onClick])

    return <a href="#" className="account-balance" onClick={onBalanceClick}>
        <div className="condensed">
            {stripTrailingZeros(formatWithPrecision(trustline.balance))}
        </div>
        <div className="text-tiny condensed">
            {stripTrailingZeros(formatWithPrecision(trustline.balance))} available
            {trustline.value > 0.01 && <div>{trustline.value}$</div>}
        </div>
        <span className="text-small">
            <AssetLink asset={asset} link={false} issuer={false}/>
            {/*{(balance.is_authorized === false && !isPoolShare(balance)) &&
                <i className="icon icon-lock" title={`Trustline to ${asset.toCurrency()} is not authorized by the asset issuer`}/>}*/}
        </span>
    </a>
}

export default withErrorBoundary(function ContractBalancesView({address, onSelectAsset}) {
    const {data, loaded} = useExplorerApi(`contract/${address}/balance`)
    if (!loaded)
        return <div className="loader"/>
    if (!data?.length)
        return <div className="dimmed space text-center text-small">Balances unavailable</div>
    const total = data.reduce((v, prev) => prev + (v.value || 0), 0) / 10000000
    return <>
        {total > 0.1 && <div className="dimmed text-right mobile-left text-small condensed">
            <div className="desktop-only" style={{marginTop: '-2.8em'}}/>
            <span className="mobile-only">Estimated account balances value: </span>
            ~${formatWithAutoPrecision(total)}
            <div className="desktop-only space"/>
        </div>}
        <div className="all-account-balances micro-space text-header">
            {data.map(b => <ContractBalanceView key={b.asset} trustline={b} onClick={onSelectAsset}/>)}
        </div>
    </>
})