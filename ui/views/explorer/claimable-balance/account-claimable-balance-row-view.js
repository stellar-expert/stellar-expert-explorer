import React from 'react'
import {AccountAddress, Amount, formatExplorerLink, UtcTimestamp} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {ClaimableBalanceStatus} from './claimable-balance-status-view'

export function formatClaimableBalanceValue(value) {
    if (value < 100000)
        return '>$0.001'
    return '~$' + formatWithAutoPrecision(value / 10000000)
}

export function AccountClaimableBalanceRowView({id, account, amount, value, asset, claimants, sponsor, created}) {
    return <tr className="account-balance claimable">
        <td data-header="Status: ">
            <a href={formatExplorerLink('claimable-balance', id)} target="_blank">
                <ClaimableBalanceStatus account={account} claimants={claimants}/>
            </a>
        </td>
        <td data-header="Amount: ">
            <Amount asset={AssetDescriptor.parse(asset)} amount={amount} adjust/>{' '}
            {!!value && <span className="dimmed text-tiny condensed">({formatClaimableBalanceValue(value)}) </span>}
        </td>
        <td data-header="Sender: ">
            <AccountAddress account={sponsor} chars={8}/>
        </td>
        <td data-header="Created: ">
            {created ?
                <a href={formatExplorerLink('claimable-balance', id)} target="_blank"><UtcTimestamp date={created} dateOnly/></a> :
                null}
        </td>
    </tr>
}


export function AccountClaimableBalanceRecordView({id, account, amount, value, asset, claimants, sponsor, created}) {
    return <div><a href={formatExplorerLink('claimable-balance', id)} target="_blank">
        <ClaimableBalanceStatus account={account} claimants={claimants}/>
        &emsp;
        <Amount asset={AssetDescriptor.parse(asset)} amount={amount} adjust/>{' '}
        {!!value && <span className="dimmed text-tiny condensed">({formatClaimableBalanceValue(value)}) </span>}
        {' '}
        {created ? <UtcTimestamp date={created} dateOnly/> : null}
    </a>
    </div>
}