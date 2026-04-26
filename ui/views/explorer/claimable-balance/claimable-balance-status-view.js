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
    available: 'Balance can be claimed right away',
    pending: 'Balance claiming conditions for this account not met yet',
    expired: 'Balance can\'t be claimed because claiming period expired',
    unfeasible: 'Conditions configured in such way that prevents the balance from claiming'
}

export function ClaimableBalanceStatus({account, claimants, withText = false}) {
    let status
    if (!account) {
        status = getAnyStatus(claimants)
    } else {
        const claimant = claimants.find(c => c.destination === account)
        status = claimant ? getClaimableBalanceClaimStatus(claimant) : 'unavailable'
    }
    return <>
        <span className={claimableBalanceStatusIcons[status] + ' dimmed'}/>{' '}
        <span>{status}<InfoTooltip>{claimableBalanceStatusHints[status]}</InfoTooltip></span>
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