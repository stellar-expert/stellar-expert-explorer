import React from 'react'
import {InfoTooltip as Info} from '@stellar-expert/ui-framework'

export default function AccountAuthorizationFlagsView({accountInfo}) {
    const description = []
    if (accountInfo.flags.auth_required) {
        description.push('required')
    }
    if (accountInfo.flags.auth_revocable) {
        description.push('revocable')
    }
    if (accountInfo.flags.auth_immutable) {
        description.push('immutable')
    }
    if (accountInfo.flags.auth_clawback_enabled) {
        description.push('clawback_enabled')
    }
    return <>
        <dt>Asset authorization flags:</dt>
        <dd>
            {!!accountInfo.flags.auth_immutable && <i className="icon lock green"/>}
            {description.join(', ') || 'none'}
            <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#flags">
                <ul>
                    <li><code>AUTH_REQUIRED</code> Requires the issuing account to give other accounts permission before
                        they can hold the issuing account’s credit.
                    </li>
                    <li><code>AUTH_REVOCABLE</code> Allows the issuing account to revoke its credit held by other
                        accounts.
                    </li>
                    <li><code>AUTH_CLAWBACK_ENABLED</code> Allows the issuing account to clawback tokens without the
                        account consent in case of service terms violation.
                    </li>
                    <li><code>AUTH_IMMUTABLE</code> If set then none of the authorization flags can be set and the
                        account can never be deleted.
                    </li>
                </ul>
            </Info>
        </dd>
    </>
}