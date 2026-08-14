import React, {useCallback, useEffect, useState} from 'react'
import {Button, ButtonGroup, navigation} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {findPlan, freePlan, maxYearlySavings} from '../../../../business-logic/billing/api-plans'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import PlanSelectorView from '../../user/plan-selector-view'

/**
 * Plan switching on its own page instead of inside a dialog - the catalogue needs the full width, and
 * the choice carries into checkout as a step rather than closing a modal
 * @return {JSX.Element}
 */
export default function ChangePlanPage() {
    const {userId} = useSession()
    const [account, setAccount] = useState()
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        if (!userId)
            return

        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
    }, [userId])

    const changePeriod = useCallback(e => setPeriod(e.target.dataset.period), [])

    //the free plan needs no payment, so it is the one switch that never routes through checkout
    const selectPlan = useCallback(plan => {
        if (plan.key === freePlan.key)
            return navigation.navigate('/account/subscription')
        navigation.navigate(`/account/subscription/checkout?plan=${plan.key}&period=${period}`)
    }, [period])

    const action = <a href="/account/subscription">← Back to subscription</a>

    if (!userId)
        return <SimplePageLayout title="Change plan" action={action}>
            <SegmentLoader inside/>
        </SimplePageLayout>

    const currentPlan = account?.subscription?.plan || (account ? freePlan.key : undefined)
    const currentTerm = account?.subscription?.period === 'year' ? 'year' : 'month'

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
                    {!!account?.subscription && <>, {currentTerm === 'year' ? 'yearly' : 'monthly'}</>}</strong>
            </span>}
        </div>
        <div className="space">
            <PlanSelectorView currentPlan={currentPlan} currentTerm={currentTerm} period={period}
                              onSelect={selectPlan}/>
        </div>
        <div className="card card-blank billing-card billing-photon-note space">
            <div className="dual-layout">
                <div className="dimmed text-small">
                    A photon is one compute unit. Each request charges a different number of photons depending
                    on how much work the query does. When the monthly allocation runs out, requests keep working
                    at free-tier limits (60 req/min, free endpoints) until the next cycle — we prompt you to
                    upgrade instead of cutting you off.
                </div>
                <a href="/openapi.html" target="_blank" className="nowrap">Photon reference&nbsp;→</a>
            </div>
        </div>
    </SimplePageLayout>
}