import React from 'react'
import cn from 'classnames'
import {Button, CopyToClipboard} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import SubscriptionSummaryView from '../components/subscription-summary-view'
import TokenListView from '../components/token-list-view'

//acting on the account - crediting it, logging in as its owner, deleting it - happens on its settings page
export default function UserCardView({account}) {
    const userId = account.id
    const {apiKeys = [], origins = []} = account

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
                            <TokenListView caption={<>API KEYS&nbsp;·&nbsp;{apiKeys.length}</>}
                                           tokens={apiKeys} shorten={16} placeholder="(No API keys)"/>
                        </div>
                        <div className="column column-50">
                            <div className="mobile-only micro-space"/>
                            <TokenListView caption={<>ASSOCIATED ORIGINS&nbsp;·&nbsp;{origins.length}</>}
                                           tokens={origins} placeholder="(No origins)"/>
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
                </div>
                {account.inactive && <div className="text-small dimmed">deleted</div>}
            </div>
        </div>
    </div>
}