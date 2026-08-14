import React, {useCallback, useState} from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import SettingsSectionView from '../layout/settings-section-view'
import TokenListView from '../components/token-list-view'
import UserOriginsView from '../components/user-origins-view'
import UserSubscriptionView from './user-subscription-view'

export default function UserSettingsView({settings, onUpdate}) {
    const [isProgress, setIsProgress] = useState(false)
    const {id} = useParams()

    const saveSettings = useCallback((key, value) => {
        const {origins, subscription} = {...settings, [key]: value}
        setIsProgress(true)
        return apiRequest(`account/${id}`, {
            method: 'POST',
            params: {origins, subscription}
        })
            .then(() => {
                onUpdate(prev => ({...prev, [key]: value}))
                notify({type: 'success', message: 'User settings has been updated'})
            })
            .catch(error => notify({type: 'error', message: 'Failed to save user settings. ' + error?.message}))
            .finally(() => setIsProgress(false))
    }, [settings, id, onUpdate])

    const {apiKeys = [], origins = []} = settings

    return <div>
        <SettingsSectionView title="Plan" description="Tariff, limits and renewal.">
            <UserSubscriptionView account={settings} onUpdate={saveSettings} disabled={isProgress}/>
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
                    <UserOriginsView caption={<>ORIGINS&nbsp;·&nbsp;{origins.length}</>} origins={origins}
                                     onUpdate={saveSettings} disabled={isProgress}/>
                </div>
            </div>
        </SettingsSectionView>
    </div>
}