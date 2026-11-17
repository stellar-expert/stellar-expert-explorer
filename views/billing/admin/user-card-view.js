import React, {useCallback} from 'react'
import cn from 'classnames'
import {CopyToClipboard, navigation} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import SubscriptionSummaryView from '../components/subscription-summary-view'

/**
 * One row of the admin user list - who the customer is, the credits left and the plan. Clicking it opens the
 * account page, where its settings, usage and billing history are
 * @param {Account} account
 * @return {JSX.Element}
 */
export default function UserCardView({account}) {
    const userId = account.id
    const href = `/admin/user/${userId}`

    const open = useCallback(e => {
        //the account link and the copy icon act on their own
        if (e.target.closest('a, button'))
            return
        if (e.ctrlKey || e.metaKey) {
            window.open(href, '_blank')
            return
        }
        navigation.navigate(href)
    }, [href])

    return <div className="micro-space">
        <div className="card billing-card billing-user-card compact" onClick={open}>
            <div className="row">
                <div className="column column-40 billing-user-identity">
                    <div>
                        <a href={href}><strong>{account.email || <>#{shortenString(userId)}</>}</strong></a>&nbsp;
                        <CopyToClipboard text={account.email || userId}/>
                    </div>
                    {account.inactive && <div className="text-tiny dimmed">deleted</div>}
                </div>
                <div className="column column-20">
                    <div className={cn('billing-user-balance-value', {'color-warning': !account.balance})}>
                        {formatWithAutoPrecision(account.balance)}
                    </div>
                    <div className="dimmed text-tiny">CREDITS</div>
                </div>
                <div className="column column-40">
                    <SubscriptionSummaryView account={account} compact/>
                </div>
            </div>
        </div>
    </div>
}
