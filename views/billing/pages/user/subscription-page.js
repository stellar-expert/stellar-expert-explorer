import React, {useEffect, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {isPaymentOverdue} from '../../../../business-logic/billing/account-status'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import NoticeView from '../../components/notice-view'
import SubscriptionCardView from '../../components/subscription-card-view'
import PaymentMethodView from '../../components/payment-method-view'
import InvoiceListView from '../../components/invoice-list-view'

//Paddle collects the new instrument itself - and, for an overdue renewal, the payment that is due
const paymentMethodLink = '/account/subscription/payment-method'

/**
 * The plan in force and how it is paid for
 * @return {JSX.Element}
 */
export default function SubscriptionPage() {
    const {userId, impersonated} = useSession()
    const [account, setAccount] = useState()
    const [invoices, setInvoices] = useState()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!userId)
            return

        setIsLoading(true)
        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
            .finally(() => setIsLoading(false))
        apiRequest(`account/${userId}/invoice`)
            .then(res => setInvoices(res.invoices))
            .catch(() => setInvoices(undefined))
    }, [userId])

    if (isLoading || !userId)
        return <SimplePageLayout title="Your subscription">
            <SegmentLoader inside/>
        </SimplePageLayout>

    const {subscription, paymentMethod} = account || {}
    //the server takes what Paddle bills for from the owner only - never from staff logged in as them
    const isOwnerAction = subscription?.provider === 'paddle' && !impersonated

    return <SimplePageLayout title="Your subscription">
        {isPaymentOverdue(account) && <NoticeView warning>
            The last renewal payment did not go through, so requests are served at free-tier limits until it
            does. Update the payment method to settle it.
            {isOwnerAction && <div>
                <Button small href={paymentMethodLink}>Update payment method</Button>
            </div>}
        </NoticeView>}
        <SubscriptionCardView account={account} onUpdate={setAccount}/>
        <div className="row space">
            <div className="column column-50">
                <PaymentMethodView method={paymentMethod} changeLink={isOwnerAction ? paymentMethodLink : undefined}/>
            </div>
            <div className="column column-50">
                <div className="card card-blank billing-card billing-invoices">
                    <div className="dual-layout">
                        <span className="dimmed text-small">RECENT INVOICES</span>
                        <a href="/account/billing-history" className="text-small">View and download</a>
                    </div>
                    <InvoiceListView invoices={invoices?.slice(0, 3)} accountId={userId} compact/>
                </div>
            </div>
        </div>
    </SimplePageLayout>
}
