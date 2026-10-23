import React, {useCallback, useEffect, useState} from 'react'
import {Button, UtcTimestamp} from '@stellar-expert/ui-framework'
import {apiRequest, performApiCall} from '../../../../business-logic/billing/billing-api'
import {isPaymentOverdue, isSubscriptionActive} from '../../../../business-logic/billing/account-status'
import {describePlanShort, findPlan, freePlan} from '../../../../business-logic/billing/api-plans'
import {openOverlayCheckout} from '../../../../business-logic/billing/paddle-loader'
import {useSession} from '../../auth/auth-session'
import {confirmAction} from '../../utils/confirm-action'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import NoticeView from '../../components/notice-view'
import SubscriptionCardView from '../../components/subscription-card-view'
import PaymentMethodView from '../../components/payment-method-view'
import InvoiceListView from '../../components/invoice-list-view'
import DestructiveActionsView from '../../user/destructive-actions-view'

/**
 * The plan in force, how it is paid for, and the ways to end it
 * @return {JSX.Element}
 */
export default function SubscriptionPage() {
    const {userId, impersonated} = useSession()
    const [account, setAccount] = useState()
    const [invoices, setInvoices] = useState()
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdatingMethod, setIsUpdatingMethod] = useState(false)

    const loadAccount = useCallback(() => apiRequest(`account/${userId}`)
        .then(setAccount)
        .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message})),
    [userId])

    useEffect(() => {
        if (!userId)
            return

        setIsLoading(true)
        loadAccount()
            .finally(() => setIsLoading(false))
        apiRequest(`account/${userId}/invoice`)
            .then(res => setInvoices(res.invoices))
            .catch(() => setInvoices(undefined))
    }, [userId, loadAccount])

    const toggleRenewal = useCallback(async () => {
        const subscription = account?.subscription
        const isPaused = subscription.autoRenew === false
        if (!isPaused && !await confirmAction(<>
            Cancel automatic renewal? {findPlan(subscription.plan)?.name || subscription.plan} stays active
            until <UtcTimestamp date={subscription.to} dateOnly/>, no further charges.
        </>))
            return

        apiRequest(`account/${userId}/subscription/renewal`, {method: 'POST', params: {autoRenew: isPaused}})
            .then(res => {
                setAccount(prev => ({...prev, subscription: res.subscription}))
                notify({type: 'success', message: `Automatic renewal has been ${isPaused ? 'resumed' : 'cancelled'}`})
            })
            .catch(error => notify({type: 'error', message: 'Failed to update subscription. ' + error?.message}))
    }, [account, userId])

    //Paddle collects the new instrument itself - and, for an overdue renewal, the payment that is due
    const updatePaymentMethod = useCallback(async () => {
        setIsUpdatingMethod(true)
        try {
            const {transactionId} = await apiRequest(`account/${userId}/payment-method`, {method: 'POST'})
            if (await openOverlayCheckout(transactionId)) {
                await performApiCall(`account/${userId}/paddle/sync`, {method: 'POST'})
                await loadAccount()
                notify({type: 'success', message: 'Your payment method has been updated'})
            }
        } catch (error) {
            notify({type: 'error', message: 'Failed to update the payment method. ' + error?.message})
        } finally {
            setIsUpdatingMethod(false)
        }
    }, [userId, loadAccount])

    if (isLoading || !userId)
        return <SimplePageLayout title="Your subscription">
            <SegmentLoader inside/>
        </SimplePageLayout>

    const {subscription, paymentMethod} = account || {}
    const isPaddle = subscription?.provider === 'paddle'
    //the server takes what Paddle bills for from the owner only - never from staff logged in as them
    const isOwnerAction = isPaddle && !impersonated

    return <SimplePageLayout title="Your subscription">
        {isPaymentOverdue(account) && <NoticeView warning>
            The last renewal payment did not go through, so requests are served at free-tier limits until it
            does. Update the payment method to settle it.
            {isOwnerAction && <div>
                <Button small disabled={isUpdatingMethod} onClick={updatePaymentMethod}>Update payment method</Button>
            </div>}
        </NoticeView>}
        {subscription ?
            <SubscriptionCardView subscription={subscription} isActive={isSubscriptionActive(account)}
                                  onToggleRenewal={isPaddle && impersonated ? undefined : toggleRenewal}/> :
            <FreePlanView/>}
        <div className="row space">
            <div className="column column-50">
                <PaymentMethodView method={paymentMethod} disabled={isUpdatingMethod}
                                   onChange={isOwnerAction ? updatePaymentMethod : undefined}/>
            </div>
            <div className="column column-50">
                <div className="card card-blank billing-card billing-invoices">
                    <div className="dual-layout">
                        <span className="dimmed text-small">RECENT INVOICES</span>
                        <a href="/account/billing-history" className="text-small">All invoices</a>
                    </div>
                    <InvoiceListView invoices={invoices?.slice(0, 3)} accountId={userId} compact/>
                </div>
            </div>
        </div>
        <div className="space">
            <DestructiveActionsView/>
        </div>
    </SimplePageLayout>
}

/**
 * Free plan card, shown while an account has no subscription
 * @return {JSX.Element}
 * @private
 */
function FreePlanView() {
    return <div className="card card-blank billing-card text-center billing-subscription-card">
        <div className="space">
            <div>
                <strong>{freePlan.name}</strong>
                <span className="dimmed">&nbsp;· {describePlanShort(freePlan)}</span>
            </div>
            <div className="dimmed text-small micro-space">{freePlan.audience}</div>
            <div className="micro-space">
                <a href="/account/subscription/change" className="button">Choose a plan</a>
            </div>
        </div>
    </div>
}
