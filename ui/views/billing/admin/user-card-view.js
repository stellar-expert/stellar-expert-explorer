import React, {useCallback} from 'react'
import cn from 'classnames'
import {Button, CopyToClipboard} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {confirmAction} from '../utils/confirm-action'
import SubscriptionSummaryView from '../components/subscription-summary-view'
import TokenListView from '../components/token-list-view'
import UserCreditDepositView from './user-credit-deposit-view'

export default function UserCardView({account, onUpdate}) {
    const userId = account.id

    const toggleAccount = useCallback(async () => {
        if (await confirmAction(`${account.inactive ? 'Restore' : 'Delete'} this account?`)) {
            apiRequest(`account/${userId}`, {
                method: 'DELETE'
            })
                //refresh user list
                .then(onUpdate)
                .catch(e => notify({type: 'warning', message: e.message}))
        }
    }, [userId, account.inactive, onUpdate])

    return <div className="space">
        <div className="card billing-card billing-user-card">
            <div className="row">
                <div className="column column-33 billing-user-identity">
                    <div>
                        <strong>{account.email || <>#{shortenString(userId)}</>}</strong>&nbsp;
                        <CopyToClipboard text={account.email || userId}/>
                    </div>
                    <div className="micro-space">
                        <a href={`/admin/user/${userId}/billing-history`} className="text-small">
                            billing history →</a>
                    </div>
                    <div className="billing-user-balance">
                        <div className={cn('billing-stat-value', {'color-warning': !account.balance})}>
                            {formatWithAutoPrecision(account.balance)}
                        </div>
                        <div className="dimmed text-small">CREDIT BALANCE</div>
                    </div>
                </div>
                <div className="column column-66 billing-user-details">
                    <div className="row">
                        <div className="column column-50">
                            <div className="mobile-only micro-space"/>
                            <TokenListView caption={<>API KEYS&nbsp;·&nbsp;{account.apiKeys.length}</>}
                                           tokens={account.apiKeys} shorten={16} placeholder="(No API keys)"/>
                        </div>
                        <div className="column column-50">
                            <div className="mobile-only micro-space"/>
                            <TokenListView caption={<>ORIGINS&nbsp;·&nbsp;{account.origins.length}</>}
                                           tokens={account.origins} placeholder="(No origins)"/>
                        </div>
                    </div>
                    <div className="row micro-space">
                        <div className="column">
                            <div className="dimmed text-small">SUBSCRIPTION</div>
                            <SubscriptionSummaryView account={account}/>
                        </div>
                    </div>
                </div>
            </div>
            <hr/>
            <div className="dual-layout billing-user-actions">
                <div>
                    <Button href={`/admin/user/${userId}`} stackable small>Settings</Button>
                    <UserCreditDepositView account={account} onUpdate={onUpdate}/>
                    <Button stackable small outline disabled={account.inactive} data-id={userId}
                            onClick={logInAs}>Log in as</Button>
                </div>
                <div className="text-small">
                    <a href="#" onClick={toggleAccount} data-id={userId}>
                        {account.inactive ?
                            <><i className="icon-undo-circle"/>&nbsp;Restore</> :
                            <span className="color-danger"><i className="icon-delete-circle"/>&nbsp;Delete</span>}
                    </a>
                </div>
            </div>
        </div>
    </div>
}

function logInAs(e) {
    const userId = e.target.dataset.id
    apiRequest(`auth/login-as`, {
        method: 'POST',
        params: {userId}
    })
        .then(res => {
            localStorage.setItem('loginAsToken', res.accessToken)
            location.href = '/account'
        })
        .catch(e => notify({type: 'warning', message: e.message}))
}