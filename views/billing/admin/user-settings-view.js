import React, {useCallback, useState} from 'react'
import cn from 'classnames'
import {useParams} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import SettingsSectionView from '../layout/settings-section-view'
import TokenListView from '../components/token-list-view'
import UserOriginsView from '../components/user-origins-view'
import SubscriptionCardView from '../components/subscription-card-view'
import UserCreditDepositView from './user-credit-deposit-view'
import UserAccountActionsView from './user-account-actions-view'
import UserEmailView from './user-email-view'

export default function UserSettingsView({settings, onUpdate, onReload}) {
    const [isProgress, setIsProgress] = useState(false)
    const {id} = useParams()

    //only the origins are sent - the subscription has its own routes, and re-posting it would overwrite one
    //the payment processor manages
    const saveOrigins = useCallback((key, origins) => {
        setIsProgress(true)
        return apiRequest(`account/${id}`, {
            method: 'POST',
            params: {origins}
        })
            .then(() => {
                onUpdate(prev => ({...prev, origins}))
                notify({type: 'success', message: 'User settings has been updated'})
            })
            .catch(error => notify({type: 'error', message: 'Failed to save user settings. ' + error?.message}))
            .finally(() => setIsProgress(false))
    }, [id, onUpdate])

    const {apiKeys = [], origins = [], subscription, balance} = settings
    //a plan bought through Paddle is the customer's to change - staff can only look at it
    const changeTitle = !subscription ? 'Subscribe user' :
        subscription.provider === 'paddle' ? 'Details' : 'Change'

    return <div>
        <SettingsSectionView title="Email" description="The address the owner signs in with.">
            <UserEmailView account={settings} onUpdate={onUpdate}/>
        </SettingsSectionView>
        <div className="space"/>
        <hr/>
        <SettingsSectionView title="Plan" description="Tariff, limits and renewal.">
            <SubscriptionCardView account={settings} onUpdate={onUpdate} disabled={isProgress}
                                  changeLink={`/admin/user/${id}/subscription`} changeTitle={changeTitle}/>
        </SettingsSectionView>
        <div className="space"/>
        <hr/>
        <SettingsSectionView title="Credits" description="Compute units left on the balance. Added credits are spent
                             along with the monthly allowance.">
            <div className="dual-layout">
                <div>
                    <div className={cn('billing-stat-value', {'color-warning': !balance})}>
                        {formatWithAutoPrecision(balance || 0)}
                    </div>
                    <a href={`/admin/user/${id}/billing-history`} className="text-small">billing history →</a>
                </div>
                <UserCreditDepositView account={settings} onUpdate={onReload}/>
            </div>
        </SettingsSectionView>
        <div className="space"/>
        <hr/>
        <SettingsSectionView title="Credentials" description="Keys are issued by the account owner. Origins
                             are accepted for every API key on this account.">
            <div className="row">
                <div className="column column-50">
                    <TokenListView caption={<>API KEYS&nbsp;·&nbsp;{apiKeys.length}</>} tokens={apiKeys}
                                   shorten={16} placeholder="(No API keys)"/>
                </div>
                <div className="column column-50">
                    <div className="mobile-only micro-space"/>
                    <UserOriginsView caption={<>ASSOCIATED ORIGINS&nbsp;·&nbsp;{origins.length}</>} origins={origins}
                                     onUpdate={saveOrigins} disabled={isProgress}/>
                </div>
            </div>
        </SettingsSectionView>
        <div className="space"/>
        <hr/>
        <UserAccountActionsView account={settings} onReload={onReload}/>
    </div>
}
