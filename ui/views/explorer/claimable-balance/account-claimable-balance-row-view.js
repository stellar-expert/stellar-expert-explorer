import React from 'react'
import {getClaimableBalanceClaimStatus} from '@stellar-expert/claimable-balance-utils'
import {AccountAddress, Amount, UtcTimestamp} from '@stellar-expert/ui-framework'
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

export default function AccountClaimableBalanceRowView({account, amount, value, asset, claimants, sponsor, last_modified_time}) {
    const claimant = claimants.find(c => c.destination === account)
    const status = claimant ? getClaimableBalanceClaimStatus(claimant) : 'unavailable'

    return <div className="account-balance claimable">
        <span className={claimableBalanceStatusIcons[status] + ' dimmed'} title={claimableBalanceStatusHints[status]}/>{' '}
        <Amount asset={AssetDescriptor.parse(asset)} amount={amount}/>{' '}
        {!!value && <span className="dimmed text-tiny condensed">({formatBalanceValue(value)} USD) </span>}
        sent by <AccountAddress account={sponsor} chars={8}/>{' '}
        <UtcTimestamp date={last_modified_time} dateOnly/>
    </div>
}