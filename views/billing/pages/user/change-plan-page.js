import React, {useCallback, useEffect, useState} from 'react'
import {Button, ButtonGroup, UtcTimestamp, navigation, parseQuery} from '@stellar-expert/ui-framework'
import {formatDateUTC} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {findPlan, freePlan, maxYearlySavings} from '../../../../business-logic/billing/api-plans'
import {isManagedByStaff, isPaymentOverdue} from '../../../../business-logic/billing/account-status'
import {useSession} from '../../auth/auth-session'
import {confirmAction} from '../../utils/confirm-action'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import NoticeView from '../../components/notice-view'
import PlanSelectorView from '../../user/plan-selector-view'

/**
 * Plan switching on its own page instead of inside a dialog - the catalogue needs the full width, and
 * the choice carries into checkout as a step rather than closing a modal
 * @return {JSX.Element}
 */
export default function ChangePlanPage() {
    const {userId, impersonated} = useSession()
    const [account, setAccount] = useState()
    //a plan picked on the pricing page arrives in the query string
    const [period, setPeriod] = useState(() => parseQuery().period === 'year' ? 'year' : 'month')
    const [highlight] = useState(() => findPlan(parseQuery().plan)?.key)
    const [isProgress, setIsProgress] = useState(false)

    useEffect(() => {
        if (!userId)
            return

        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
    }, [userId])

    const changePeriod = useCallback(e => setPeriod(e.target.dataset.period), [])

    const selectPlan = useCallback(plan => {
        navigation.navigate(`/account/subscription/checkout?plan=${plan.key}&period=${period}`)
    }, [period])

    //the free plan is reached by letting the paid one run out, never by a refund
    const cancelAtPeriodEnd = useCallback(async () => {
        const {subscription} = account
        if (!await confirmAction(<>
            Cancel at the end of the paid period? {findPlan(subscription.plan)?.name || subscription.plan} stays
            active until <UtcTimestamp date={subscription.to} dateOnly/>, no further charges. After that the
            account moves to {freePlan.name}.
        </>))
            return
        setIsProgress(true)
        apiRequest(`account/${userId}/subscription/renewal`, {method: 'POST', params: {autoRenew: false}})
            .then(() => {
                notify({type: 'success', message: 'Your subscription will not renew'})
                navigation.navigate('/account/subscription')
            })
            .catch(error => {
                notify({type: 'error', message: 'Failed to cancel the subscription. ' + error?.message})
                setIsProgress(false)
            })
    }, [account, userId])

    const action = <a href="/account/subscription">← Back to subscription</a>

    if (!userId)
        return <SimplePageLayout title="Change plan" action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    const subscription = account?.subscription
    const currentPlan = subscription?.plan || (account ? freePlan.key : undefined)
    const currentTerm = subscription?.period === 'year' ? 'year' : 'month'
    const lock = resolveLock(account, period, impersonated)

    return <SimplePageLayout title="Change plan" action={action}>
        <div className="dual-layout billing-plan-toolbar">
            <div className="billing-period-switch">
                <ButtonGroup>
                    <Button small disabled={period === 'month'} data-period="month" onClick={changePeriod}>
                        Monthly
                    </Button>
                    <Button small disabled={period === 'year'} data-period="year" onClick={changePeriod}>
                        Yearly
                    </Button>
                </ButtonGroup>
                <span className="color-success text-small">Yearly billing saves up to {maxYearlySavings}%</span>
            </div>
            {!!currentPlan && <span className="dimmed text-small billing-current-plan">
                Current plan: <strong>{findPlan(currentPlan)?.name || currentPlan}
                    {!!subscription && <>, {currentTerm === 'year' ? 'yearly' : 'monthly'}</>}</strong>
            </span>}
        </div>
        {!!lock && <div className="space">
            <NoticeView warning>{lock.message}</NoticeView>
        </div>}
        <div className="space">
            <PlanSelectorView currentPlan={currentPlan} currentTerm={currentTerm} period={period}
                              highlight={highlight} lock={lock} disabled={isProgress}
                              endsAt={subscription?.autoRenew === false ? subscription.to : undefined}
                              onSelect={selectPlan} onCancel={cancelAtPeriodEnd}/>
        </div>
        <div className="card card-blank billing-card billing-compute-units-note space">
            <div className="dual-layout">
                <div className="dimmed text-small">
                    Each request charges a different number of compute units depending
                    on how much work the query does. When the monthly allocation runs out, requests keep working
                    at free-tier limits (60 req/min, free endpoints) until the next cycle — we prompt you to
                    upgrade instead of cutting you off.
                </div>
                <a href="/openapi.html" target="_blank" className="nowrap">Compute unit reference&nbsp;→</a>
            </div>
        </div>
    </SimplePageLayout>
}

/**
 * Why the switches on offer cannot be made right now
 * @param {{subscription: {}}} [account]
 * @param {'month'|'year'} period - the term the catalogue is priced for
 * @param {Boolean} [impersonated] - staff are looking at the account through "log in as"
 * @return {{message: String, all: Boolean}|null} - `all` locks the cancellation as well as the paid plans
 * @private
 */
function resolveLock(account, period, impersonated) {
    const subscription = account?.subscription
    if (impersonated)
        return {
            //a contract staff set up is still theirs to renew or not
            all: subscription?.provider === 'paddle',
            message: 'Plans are bought and changed by the account owner, not while logged in as them.'
        }
    if (isPaymentOverdue(account))
        return {
            all: true,
            message: 'The last renewal payment did not go through. Update the payment method on the subscription ' +
                'page before changing plan.'
        }
    if (isManagedByStaff(account))
        return {
            all: false,
            message: 'Your plan was arranged with our team, so changes to it go through us as well. Contact us ' +
                'at info@stellar.expert to switch.'
        }
    if (subscription?.provider === 'paddle' && subscription.period === 'year' && period === 'month')
        return {
            all: false,
            message: 'A yearly plan cannot switch to monthly billing. Turn off renewal, then pick a monthly plan ' +
                `once the paid year ends on ${formatDateUTC(subscription.to).split(' ')[0]}.`
        }
    return null
}
