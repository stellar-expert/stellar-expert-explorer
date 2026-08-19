import React, {useCallback, useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {isSubscriptionActive} from '../../../../business-logic/billing/account-status'
import {useSession} from '../../auth/auth-session'
import {confirmAction} from '../../utils/confirm-action'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import SubscriptionCardView from '../../components/subscription-card-view'
import PaymentMethodView from '../../components/payment-method-view'
import InvoiceListView from '../../components/invoice-list-view'
import DestructiveActionsView from '../../user/destructive-actions-view'

/**
 * The plan in force, how it is paid for, and the ways to end it
 * @return {JSX.Element}
 */
export default function SubscriptionPage() {
    const {userId} = useSession()
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

    const toggleRenewal = useCallback(async () => {
        const subscription = account?.subscription
        const isPaused = subscription.autoRenew === false
        if (!isPaused &&
            !await confirmAction('Cancel automatic renewal? The subscription stays active until it expires.'))
            return

        const updated = {...subscription, autoRenew: isPaused}
        apiRequest(`account/${userId}`, {method: 'POST', params: {subscription: updated}})
            .then(() => {
                setAccount(prev => ({...prev, subscription: updated}))
                notify({type: 'success', message: `Automatic renewal has been ${isPaused ? 'resumed' : 'cancelled'}`})
            })
            .catch(error => notify({type: 'error', message: 'Failed to update subscription. ' + error?.message}))
    }, [account, userId])

    if (isLoading || !userId)
        return <SimplePageLayout title="Your subscription">
            <SegmentLoader inside/>
        </SimplePageLayout>

    const {subscription, paymentMethod} = account || {}

    return <SimplePageLayout title="Your subscription">
        {subscription ?
            <SubscriptionCardView subscription={subscription} isActive={isSubscriptionActive(account)}
                                  onToggleRenewal={toggleRenewal}/> :
            <NoSubscriptionView/>}
        <div className="row space">
            <div className="column column-50">
                <PaymentMethodView method={paymentMethod}/>
            </div>
            <div className="column column-50">
                <div className="card card-blank billing-card billing-invoices">
                    <div className="dual-layout">
                        <span className="dimmed text-small">RECENT INVOICES</span>
                        <a href="/account/billing-history" className="text-small">All invoices</a>
                    </div>
                    <InvoiceListView invoices={invoices?.slice(0, 3)} compact/>
                </div>
            </div>
        </div>
        <div className="space">
            <DestructiveActionsView/>
        </div>
    </SimplePageLayout>
}

/**
 * @return {JSX.Element}
 * @private
 */
function NoSubscriptionView() {
    return <div className="card card-blank billing-card text-center billing-subscription-card">
        <div className="space">
            <div className="dimmed">No active subscription</div>
            <div className="micro-space">
                <a href="/account/subscription/change" className="button">Choose a plan</a>
            </div>
        </div>
    </div>
}