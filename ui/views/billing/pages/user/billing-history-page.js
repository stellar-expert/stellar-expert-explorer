import React from 'react'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import BillingHistoryView from '../../components/billing-history-view'

/**
 * Everything the signed-in account has been billed
 * @return {JSX.Element}
 */
export default function BillingHistoryPage() {
    const {userId, email} = useSession()
    const action = !!email && <span className="dimmed text-small">Billed to {email}</span>

    return <SimplePageLayout title="Billing history" action={action}>
        <BillingHistoryView account={userId}/>
    </SimplePageLayout>
}
