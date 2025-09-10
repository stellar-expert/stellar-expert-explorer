import React from 'react'
import {InfoTooltip} from '@stellar-expert/ui-framework'
import {getClaimableBalanceClaimStatus} from '@stellar-expert/claimable-balance-utils'

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

export function ClaimableBalanceStatus({account, claimants}) {
    let status
    if (!account) {
        status = getAnyStatus(claimants)
    } else {
        const claimant = claimants.find(c => c.destination === account)
        status = claimant ? getClaimableBalanceClaimStatus(claimant) : 'unavailable'
    }
    return <>
        <span className={claimableBalanceStatusIcons[status] + ' dimmed'} title={claimableBalanceStatusHints[status]}/>
        <span className="mobile-only">{status}<InfoTooltip>{claimableBalanceStatusHints[status]}</InfoTooltip></span>
    </>
}

function getAnyStatus(claimants) {
    const statuses = new Set(claimants.map(claimant => getClaimableBalanceClaimStatus(claimant)))
    for (let status of ['available', 'pending', 'expired']) {
        if (statuses.has(status))
            return status
    }
    return 'unfeasible'
}