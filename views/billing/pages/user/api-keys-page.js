import React, {useCallback, useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {canAddOrigins, canIssueApiKeys, isOnFreePlan} from '../../../../business-logic/billing/account-status'
import {freePlan, paidPlans} from '../../../../business-logic/billing/api-plans'
import {useSession} from '../../auth/auth-session'
import {confirmAction} from '../../utils/confirm-action'
import UserApiKeysView, {maxApiKeys} from '../../components/user-apikeys-view'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import UserOriginsView from '../../components/user-origins-view'
import ApiKeyGenerationView from '../../user/api-key-generation-view'
import {DangerRowView} from '../../user/destructive-actions-view'

//plans that serve requests by origin, named the way an upgrade prompt lists them
const originPlanNames = paidPlans.filter(plan => plan.originAccess).map(plan => plan.name).join(' and ')

/**
 * Credentials of the account - the keys themselves and the origins allowed to use them. Keys come with a
 * paid plan, origins with the plans that grant origin access
 * @return {JSX.Element}
 */
export default function ApiKeysPage() {
    const {userId} = useSession()
    const [apiKeyList, setApiKeyList] = useState()
    const [apiKeyDetails, setApiKeyDetails] = useState()
    const [originList, setOriginList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isFree, setIsFree] = useState(false)
    const [canIssueKeys, setCanIssueKeys] = useState(false)
    const [canAddOrigin, setCanAddOrigin] = useState(false)

    useEffect(() => {
        if (!userId)
            return

        setIsLoading(true)
        apiRequest(`account/${userId}`)
            .then(res => {
                setIsFree(isOnFreePlan(res))
                setCanIssueKeys(canIssueApiKeys(res))
                setCanAddOrigin(canAddOrigins(res))
                setApiKeyList(res.apiKeys || [])
                setOriginList(res.origins || [])
            })
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [userId])

    const loadDetails = useCallback(() => {
        if (!userId)
            return
        apiRequest(`account/${userId}/api-key`)
            .then(res => setApiKeyDetails(res.apiKeys || []))
            .catch(() => setApiKeyDetails(undefined))
    }, [userId])

    useEffect(loadDetails, [loadDetails])

    const updateApiKeys = useCallback(value => {
        setApiKeyList(value)
        loadDetails()
    }, [loadDetails])

    const revokeAllKeys = useCallback(async () => {
        if (!await confirmAction('Revoke every API key? Applications using them stop working immediately.'))
            return
        setIsSaving(true)
        apiRequest(`account/${userId}/api-key`, {method: 'POST', params: {apiKeys: []}})
            .then(() => {
                updateApiKeys([])
                notify({type: 'success', message: 'All API keys have been revoked'})
            })
            .catch(error => notify({type: 'error', message: 'Failed to revoke API keys. ' + error?.message}))
            .finally(() => setIsSaving(false))
    }, [userId, updateApiKeys])

    const saveOrigins = useCallback((key, origins) => {
        setIsSaving(true)
        apiRequest(`account/${userId}`, {method: 'POST', params: {origins}})
            .then(() => setOriginList(origins))
            .catch(error => notify({type: 'error', message: 'Failed to update origins. ' + error?.message}))
            .finally(() => setIsSaving(false))
    }, [userId])

    if (isLoading || !apiKeyList)
        return <SimplePageLayout title="API keys">
            <SegmentLoader inside/>
        </SimplePageLayout>

    if (isFree)
        return <SimplePageLayout title="API keys">
            <PaidPlanRequiredView/>
        </SimplePageLayout>

    return <SimplePageLayout title="API keys">
        <div className="row">
            <div className="column column-50">
                <UserApiKeysView apiKeys={apiKeyList} updateApiKeys={updateApiKeys} details={apiKeyDetails}/>
                {canIssueKeys ?
                    apiKeyList.length < maxApiKeys && <ApiKeyGenerationView onUpdate={updateApiKeys}/> :
                    <div className="dimmed text-small micro-space">
                        The paid term of your plan has ended, so new keys cannot be issued until
                        you <a href="/account/subscription">renew it</a>.
                    </div>}
                <div className="dimmed text-tiny micro-space">
                    Keys inherit the limits of your current plan. Revoking a key takes effect immediately.
                </div>
            </div>
            <div className="column column-50">
                <div className="mobile-only micro-space"/>
                <UserOriginsView origins={originList} caption="ASSOCIATED ORIGINS" onUpdate={saveOrigins}
                                 canAdd={canAddOrigin} disabled={isSaving}/>
                <div className="dimmed text-tiny micro-space">
                    {canAddOrigin ?
                        <>All requests from those origins are counted towards your account usage. With active
                            origins you can call our APIs directly from your web app.</> :
                        <>Origins come with {originPlanNames} plans - they let your web app call our APIs
                            directly, without a key. <a href="/account/subscription/change">Change plan</a></>}
                </div>
            </div>
        </div>
        {apiKeyList.length > 0 && <div className="card double-space billing-card billing-danger">
            <DangerRowView title="Revoke all API keys" action="Revoke keys" disabled={isSaving}
                           onAction={revokeAllKeys}
                           description="Every key stops working immediately. Your subscription and usage history
                                        are kept."/>
        </div>}
    </SimplePageLayout>
}

/**
 * Shown in place of the credentials on the free plan
 * @return {JSX.Element}
 * @private
 */
function PaidPlanRequiredView() {
    return <div className="card card-blank billing-card text-center billing-subscription-card">
        <div className="space">
            <strong>API keys come with a paid plan</strong>
            <div className="dimmed text-small micro-space">
                {freePlan.name} serves the free public endpoints without a key. Choose a plan to issue API keys
                and to call the API directly from your web app.
            </div>
            <div className="micro-space">
                <a href="/account/subscription/change" className="button">Choose a plan</a>
            </div>
        </div>
    </div>
}
