import React, {useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import InvoiceListView from '../../components/invoice-list-view'

/**
 * Issued invoices for the signed-in account
 * @return {JSX.Element}
 */
export default function BillingHistoryPage() {
    const {userId, email} = useSession()
    const [invoices, setInvoices] = useState()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!userId)
            return

        setIsLoading(true)
        apiRequest(`account/${userId}/invoice`)
            .then(res => setInvoices(res.invoices))
            .catch(error => notify({type: 'error', message: 'Failed to load billing history. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [userId])

    const action = !!email && <span className="dimmed text-small">Billed to {email}</span>
    const isPending = isLoading || !userId

    return <SimplePageLayout title="Billing history" action={action}>
        {isPending ? <SegmentLoader inside/> : <InvoiceListView invoices={invoices}/>}
    </SimplePageLayout>
}
