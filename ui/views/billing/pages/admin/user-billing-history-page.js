import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import SimplePageLayout from '../../layout/simple-page-layout'
import UserBillingHistoryView from '../../admin/user-billing-history-view'

export default function UserBillingHistoryPage() {
    const {id} = useParams()

    return <SimplePageLayout title="User billing history">
        <UserBillingHistoryView account={id}/>
    </SimplePageLayout>
}