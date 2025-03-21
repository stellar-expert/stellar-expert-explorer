import React from 'react'
import {getClaimableBalanceClaimStatus} from '@stellar-expert/claimable-balance-utils'
import {AccountAddress, Amount, InfoTooltip, UtcTimestamp} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'

const claimableBalanceStatusIcons = {
    available: 'icon-ok',
    pending: 'icon-clock',
    expired: 'icon-back-in-time',
    unfeasible: 'icon-block'
}

const claimableBalanceStatusHints = {
    available: 'Balance can be claimed by this account right away',
    pending: 'Balance claiming conditions for this account not met yet',
    expired: 'Balance can\'t be claimed  by this account because claiming period expired',
    unfeasible: 'Conditions configured in the way that prevents the balance from claiming by this account'
}

function formatBalanceValue(value) {
    if (value < 100000) return '>0.01'
    return '~' + formatWithAutoPrecision(value / 10000000)
}

export function AccountClaimableBalanceRowView({account, amount, value, asset, claimants, sponsor, created}) {
    const claimant = claimants.find(c => c.destination === account)
    const status = claimant ? getClaimableBalanceClaimStatus(claimant) : 'unavailable'

    return <tr className="account-balance claimable">
        <td data-header="Status: ">
            <span className={claimableBalanceStatusIcons[status] + ' dimmed'} title={claimableBalanceStatusHints[status]}/>
            <span className="mobile-only">{status}<InfoTooltip>{claimableBalanceStatusHints[status]}</InfoTooltip></span>
        </td>
        <td data-header="Amount: ">
            <Amount asset={AssetDescriptor.parse(asset)} amount={amount} adjust/>{' '}
            {!!value && <span className="dimmed text-tiny condensed">({formatBalanceValue(value)} USD) </span>}
        </td>
        <td data-header="Sender: ">
            <AccountAddress account={sponsor} chars={8}/>
        </td>
        <td data-header="Created: ">
            {created ? <UtcTimestamp date={created} dateOnly/> : null}
        </td>
    </tr>
}


export function AccountClaimableBalanceRecordView({account, amount, value, asset, claimants, sponsor, created}) {
    const claimant = claimants.find(c => c.destination === account)
    const status = claimant ? getClaimableBalanceClaimStatus(claimant) : 'unavailable'

    return <div>
        <span className={claimableBalanceStatusIcons[status] + ' dimmed'} title={claimableBalanceStatusHints[status]}/>
        <span className="mobile-only">{status}<InfoTooltip>{claimableBalanceStatusHints[status]}</InfoTooltip>&emsp;</span>
        {' '}
        <Amount asset={AssetDescriptor.parse(asset)} amount={amount} adjust/>{' '}
        {!!value && <span className="dimmed text-tiny condensed">({formatBalanceValue(value)} USD) </span>}
        {' '}
        {created ? <UtcTimestamp date={created} dateOnly/> : null}
    </div>
}