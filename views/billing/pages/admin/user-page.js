import React, {useEffect, useState} from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import UserSettingsView from '../../admin/user-settings-view'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'

export default function UserPage() {
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const {id} = useParams()

    useEffect(() => {
        if (!id)
            return null

        setIsLoading(true)
        apiRequest(`account/${id}`)
            .then(setSettings)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [id])

    const action = <span className="dimmed text-small">
        <code className="text-small billing-account-ref">account #{shortenString(id, 8)}</code>
        {!!settings.email && <>&nbsp;·&nbsp;{settings.email}</>}
    </span>

    //the header is rendered while the account loads, so moving between pages never shifts the title
    return <SimplePageLayout title="Account settings" action={action}>
        {isLoading ? <SegmentLoader inside/> : <UserSettingsView settings={settings} onUpdate={setSettings}/>}
    </SimplePageLayout>
}