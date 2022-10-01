import React from 'react'
import PropTypes from 'prop-types'
import {getAccountLockStatus, InfoTooltip as Info} from '@stellar-expert/ui-framework'

export default function AccountLockStatusView({accountInfo, forAsset = false}) {
    const status = getAccountLockStatus(accountInfo)
    const issuing = forAsset ? 'issuer ' : ''
    let description

    switch (status) {
        case 'locked':
            description = `The ${issuing}account is locked, it can\'t be used to make payments, trade, change settings or issue assets.`
            break
        case 'unlocked':
            description = `The ${issuing}account is unlocked, all operations are permitted, including payments, trades, settings changes, and assets issuing.`
            break
        default:
            description = `The ${issuing}account is locked, it can\'t be used to make payments, trade, change settings or issue assets. However, the owner can authorize trustlines and use BUMP_SEQUENCE operation for this account.`
            break
    }

    return <>
        <dt>{forAsset ? 'Issuer account' : 'Account'} lock status:</dt>
        <dd>{status !== 'unlocked' && <i className="icon lock"/>}{status}
            <Info link="https://www.stellar.org/developers/guides/concepts/operations.html#thresholds">{description}</Info>
        </dd>
    </>
}

AccountLockStatusView.propTypes = {
    accountInfo: PropTypes.object.isRequired,
    forAsset: PropTypes.bool
}