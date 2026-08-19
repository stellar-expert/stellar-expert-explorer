import React, {useEffect, useState} from 'react'
import {parseQuery, useParams} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import SimplePageLayout from '../../layout/simple-page-layout'
import BillingHistoryView from '../../components/billing-history-view'
import UserBillingHistoryFilterView from '../../admin/user-billing-history-filter'

export default function UserBillingHistoryPage() {
    const {id} = useParams()
    const [email, setEmail] = useState()
    const [filters, setFilters] = useState(parseQuery())

    useEffect(() => {
        apiRequest(`account/${id}`)
            .then(res => setEmail(res.email))
            .catch(() => setEmail(undefined))
    }, [id])

    const action = <span className="dimmed text-small">
        <code className="text-small billing-account-ref">account #{shortenString(id, 8)}</code>
        {!!email && <>&nbsp;·&nbsp;Billed to {email}</>}
    </span>

    return <SimplePageLayout title="User billing history" action={action}>
        <UserBillingHistoryFilterView onChange={setFilters}/>
        <div className="micro-space">
            <BillingHistoryView account={id} filters={filters}/>
        </div>
    </SimplePageLayout>
}