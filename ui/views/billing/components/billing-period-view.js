import React from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {findPlan} from '../../../business-logic/billing/api-plans'
import {describeDays} from '../utils/date-resolver'
import DashboardSectionView from './dashboard-section-view'

const upgradeAlertThreshold = 80
const dayMonth = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'})
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
})

/**
 * Boundaries of the calendar month the allowance is measured against
 * @return {{start: Number, end: Number, daysLeft: Number, dayOfMonth: Number, daysInMonth: Number}}
 * @private
 */
function resolveCurrentPeriod() {
    const now = new Date()
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    const daysInMonth = Math.round((nextMonth - start) / 86400000)
    const dayOfMonth = now.getUTCDate()
    return {
        start,
        end: nextMonth - 1,
        daysLeft: daysInMonth - dayOfMonth,
        dayOfMonth,
        daysInMonth
    }
}

/**
 * Allowance consumed so far this month, with the limits it is measured against
 * @param {{subscription: {}}} [account]
 * @param {Number} [used] - photons charged since the period started
 * @return {JSX.Element|null}
 */
export default function BillingPeriodView({account, used = 0}) {
    const subscription = account?.subscription
    if (!subscription)
        return null

    const {plan, monthlyCredits, rpsLimit, maxBatchSize} = subscription
    const {start, end, daysLeft, dayOfMonth, daysInMonth} = resolveCurrentPeriod()
    const limit = monthlyCredits || 0
    const consumed = limit ? Math.min(100, used / limit * 100) : 0
    const projected = Math.round(used / dayOfMonth * daysInMonth)
    const planName = findPlan(plan)?.name || plan

    const resets = `resets in ${describeDays(daysLeft)}`
    const period = `${dayMonth.format(start)} – ${dayMonthYear.format(end)} · ${resets}`

    return <DashboardSectionView title="This billing period" aside={period}>
        <div className="card card-blank billing-card billing-period">
            <div className="row">
                <div className="column column-75">
                    <div className="dual-layout billing-period-headline">
                        <div>
                            <span className="billing-period-value">{formatWithAutoPrecision(used)}</span>
                            {!!limit && <span className="dimmed"> of {formatWithAutoPrecision(limit)} photons</span>}
                        </div>
                        <span className="dimmed space">{planName} plan</span>
                    </div>
                    {!!limit && <>
                        <div className="billing-progress billing-quota space">
                            <div style={{width: `${consumed}%`}}/>
                            <span className="billing-quota-alert" style={{left: `${upgradeAlertThreshold}%`}}/>
                        </div>
                        <div className="billing-quota-scale dimmed text-tiny">
                            <span>0</span>
                            <span>upgrade alert at {upgradeAlertThreshold}%</span>
                            <span>{formatWithAutoPrecision(limit)}</span>
                        </div>
                    </>}
                    <div className="row billing-period-facts micro-space text-small">
                        {!!rpsLimit && <div className="column column-33">
                            <div className="dimmed nano-space">Rate limit</div>
                            <div><strong>{formatWithAutoPrecision(rpsLimit * 60)} req/min</strong></div>
                        </div>}
                        {!!maxBatchSize && <div className="column column-33">
                            <div className="dimmed nano-space">Max batch size</div>
                            <div><strong>{formatWithAutoPrecision(maxBatchSize)} items</strong></div>
                        </div>}
                        {!!used && <div className="column column-33">
                            <div className="dimmed nano-space">Projected month end</div>
                            <div><strong>{formatWithAutoPrecision(projected)} photons</strong></div>
                        </div>}
                    </div>
                    <div className="mobile-only space"/>
                </div>
                <div className="column column-25 billing-period-action">
                    <Button href="/account/subscription" block>Upgrade plan</Button>
                </div>
            </div>
        </div>
    </DashboardSectionView>
}