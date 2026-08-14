import React, {useCallback, useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import UserApiKeysView, {maxApiKeys} from '../../components/user-apikeys-view'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import UserOriginsView from '../../components/user-origins-view'
import ApiKeyGenerationView from '../../user/api-key-generation-view'

/**
 * Credentials of the account - the keys themselves and the origins allowed to use them
 * @return {JSX.Element}
 */
export default function ApiKeysPage() {
    const {userId} = useSession()
    const [apiKeyList, setApiKeyList] = useState()
    const [apiKeyDetails, setApiKeyDetails] = useState()
    const [originList, setOriginList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!userId)
            return

        setIsLoading(true)
        apiRequest(`account/${userId}`)
            .then(res => {
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

    const saveOrigins = useCallback((key, origins) => {
        setIsSaving(true)
        apiRequest(`account/${userId}`, {method: 'POST', params: {origins}})
            .then(() => setOriginList(origins))
            .catch(error => notify({type: 'error', message: 'Failed to update origins. ' + error?.message}))
            .finally(() => setIsSaving(false))
    }, [userId])

    const action = <ApiKeyGenerationView onUpdate={updateApiKeys}
                                         disabled={!apiKeyList || apiKeyList.length >= maxApiKeys}/>

    if (isLoading || !apiKeyList)
        return <SimplePageLayout title="API keys" action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    return <SimplePageLayout title="API keys" action={action}>
        <div className="row">
            <div className="column column-50">
                <UserApiKeysView apiKeys={apiKeyList} updateApiKeys={updateApiKeys} details={apiKeyDetails}/>
                {/*each note follows the list it explains, rather than sitting in a row of its own*/}
                <div className="dimmed text-tiny micro-space">
                    Keys inherit the limits of your current plan. Revoking a key takes effect immediately.
                </div>
            </div>
            <div className="column column-50">
                <div className="mobile-only micro-space"/>
                <UserOriginsView origins={originList} caption="ORIGINS" onUpdate={saveOrigins}
                                 disabled={isSaving}/>
                <div className="dimmed text-tiny micro-space">
                    All requests from those origins are counted towards your account usage. With active
                    origins you can call our APIs directly from your web app.
                </div>
            </div>
        </div>
    </SimplePageLayout>
}