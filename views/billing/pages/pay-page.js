import React, {useCallback, useEffect, useState} from 'react'
import {Button, parseQuery} from '@stellar-expert/ui-framework'
import {initializePaddle, subscribePaddleEvents} from '../../../business-logic/billing/paddle-loader'
import {AuthScreenView} from '../auth/auth-form'
import SegmentLoader from '../utils/segment-loader-view'
import NoticeView from '../components/notice-view'

/**
 * Landing page of the payment links Paddle mails - a renewal that failed, a card to replace. Paddle.js opens
 * the checkout for the `_ptxn` transaction in the link by itself, so all the page does is load it. No sign-in
 * is required: the link alone identifies the payment
 * @return {JSX.Element}
 */
export default function PayPage() {
    const transactionId = parseQuery()._ptxn
    const [stage, setStage] = useState(transactionId ? 'loading' : 'empty')
    const [error, setError] = useState()

    useEffect(() => {
        setStage(transactionId ? 'loading' : 'empty')
        setError(undefined)
        if (!transactionId)
            return
        let unmounted = false
        const unsubscribe = subscribePaddleEvents(({name}) => {
            if (name === 'checkout.loaded') {
                setStage('open')
            } else if (name === 'checkout.completed') {
                setStage('completed')
            } else if (name === 'checkout.closed') {
                setStage(prev => prev === 'completed' ? prev : 'closed')
            }
        })
        let fallback
        initializePaddle()
            .then(() => {
                //offer to open the checkout by hand should it not appear on its own
                if (!unmounted) {
                    fallback = setTimeout(() => setStage(prev => prev === 'loading' ? 'ready' : prev), 5000)
                }
            })
            .catch(e => {
                if (!unmounted) {
                    setError(e.message)
                }
            })
        return () => {
            unmounted = true
            clearTimeout(fallback)
            unsubscribe()
        }
    }, [transactionId])

    const reopen = useCallback(() => {
        initializePaddle()
            .then(paddle => paddle.Checkout.open({transactionId}))
            .catch(e => setError(e.message))
    }, [transactionId])

    return <AuthScreenView title={stage === 'completed' ? 'Payment received' : 'Payment'} textFirst>
        {error ? <NoticeView warning>{error}</NoticeView> : <PayStageView stage={stage} onReopen={reopen}/>}
        <div className="billing-login-footer text-small">
            <a href="/account/subscription">Go to your subscription</a>
        </div>
    </AuthScreenView>
}

/**
 * @param {'empty'|'loading'|'ready'|'open'|'closed'|'completed'} stage
 * @param {Function} onReopen
 * @return {JSX.Element}
 * @private
 */
function PayStageView({stage, onReopen}) {
    if (stage === 'loading')
        return <SegmentLoader inside/>
    if (stage === 'empty')
        return <p className="dimmed text-small">
            Nothing to pay here. Payment links from our emails open the checkout on this page.
        </p>
    if (stage === 'open')
        return <p className="dimmed text-small">Complete the payment in the checkout window.</p>
    if (stage === 'ready')
        return <Button block onClick={onReopen}>Open the checkout</Button>
    if (stage === 'closed')
        return <>
            <p className="dimmed text-small">The checkout was closed before the payment went through.</p>
            <Button block onClick={onReopen}>Open the checkout again</Button>
        </>
    return <NoticeView>
        Thank you. Your account picks up the payment within a few minutes - there is nothing else to do.
    </NoticeView>
}
