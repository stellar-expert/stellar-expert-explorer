import React, {useEffect, useState} from 'react'
import {navigation} from '@stellar-expert/ui-framework'
import {apiRequest, performApiCall} from '../../../../business-logic/billing/billing-api'
import {isPaymentOverdue} from '../../../../business-logic/billing/account-status'
import {initializePaddle, openInlineCheckout, subscribePaddleEvents}
    from '../../../../business-logic/billing/paddle-loader'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import NoticeView from '../../components/notice-view'
import PaymentMethodView from '../../components/payment-method-view'

const title = 'Update payment method'
//Paddle.js renders the inline checkout into the element carrying this class
const frameTarget = 'billing-checkout-frame'

/**
 * Replacing the instrument a Paddle subscription is charged to - Paddle's inline checkout, the same way a
 * subscription is bought
 * @return {JSX.Element}
 */
export default function PaymentMethodPage() {
    const {userId, impersonated} = useSession()
    const [account, setAccount] = useState()
    const [loadError, setLoadError] = useState()

    useEffect(() => {
        if (!userId)
            return
        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => setLoadError('Failed to retrieve account data. ' + error.message))
    }, [userId])

    const action = <a href="/account/subscription">← Back to subscription</a>

    if (loadError)
        return <SimplePageLayout title={title} action={action}>
            <NoticeView warning>{loadError}</NoticeView>
        </SimplePageLayout>

    if (!account)
        return <SimplePageLayout title={title} action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    let content
    if (impersonated) {
        content = <NoticeView>
            The payment method is changed by the account owner - it cannot be replaced while logged in as a
            customer.
        </NoticeView>
    } else if (account.subscription?.provider !== 'paddle') {
        content = <NoticeView>
            There is no subscription paid online on this account, so there is no payment method to replace.
        </NoticeView>
    } else {
        content = <div className="row">
            <div className="column column-66">
                <PaymentMethodFormView userId={userId}/>
            </div>
            <div className="column column-33">
                <PaymentMethodView method={account.paymentMethod}/>
                {isPaymentOverdue(account) && <NoticeView warning>
                    The overdue renewal is charged to the new payment method as soon as it is saved.
                </NoticeView>}
            </div>
        </div>
    }

    return <SimplePageLayout title={title} action={action}>
        {content}
    </SimplePageLayout>
}

/**
 * Paddle's checkout frame collecting the new instrument
 * @param {String} userId
 * @return {JSX.Element}
 * @private
 */
function PaymentMethodFormView({userId}) {
    const [stage, setStage] = useState('loading')
    const [error, setError] = useState()

    useEffect(() => {
        let paddle
        let transactionId
        let unmounted = false

        //the instrument reaches the account through the server - pulled from Paddle rather than left to a webhook
        async function apply() {
            await performApiCall(`account/${userId}/paddle/sync`, {method: 'POST'})
            if (unmounted)
                return
            notify({type: 'success', message: 'Your payment method has been updated'})
            navigation.navigate('/account/subscription')
        }

        const unsubscribe = subscribePaddleEvents(({name, data, detail}) => {
            if (unmounted || !transactionId)
                return
            if (name === 'checkout.error')
                return setError(detail || 'The payment form reported an error.')
            if (data?.transaction_id !== transactionId)
                return
            if (name === 'checkout.loaded') {
                setStage('ready')
            } else if (name === 'checkout.completed') {
                setStage('saving')
                apply()
            }
        })

        //no transaction is created unless the form that completes it can be shown
        initializePaddle()
            .then(instance => {
                paddle = instance
                return apiRequest(`account/${userId}/payment-method`, {method: 'POST'})
            })
            .then(res => {
                if (unmounted)
                    return
                transactionId = res.transactionId
                openInlineCheckout(paddle, transactionId, frameTarget)
            })
            .catch(e => {
                if (!unmounted) {
                    setError(e.message)
                }
            })

        return () => {
            unmounted = true
            unsubscribe()
            if (transactionId) {
                paddle.Checkout.close()
            }
        }
    }, [userId])

    return <div className="card card-blank billing-card billing-checkout">
        {!!error && <NoticeView warning>
            {error} <a href="/account/subscription">Back to subscription</a>
        </NoticeView>}
        {stage === 'loading' && !error && <SegmentLoader inside/>}
        {stage === 'saving' && <NoticeView>Saving your payment method&hellip;</NoticeView>}
        <div className={frameTarget}/>
    </div>
}
