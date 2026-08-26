import React from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {findPlan, resolveSubscriptionLimits} from '../../../business-logic/billing/api-plans'
import {addMonths, describeDays} from '../utils/date-resolver'
import DashboardSectionView from './dashboard-section-view'

const upgradeAlertThreshold = 80
const dayMonth = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'})
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
})

const DAY = 24 * 60 * 60 * 1000

/**
 * The allowance window in force - it runs from the day of the month the term started
 * @param {{from: Number, to: Number}} subscription - the term, as stored
 * @param {Number} now - epoch ms
 * @return {{start: Number, end: Number, elapsed: Number, length: Number, daysLeft: Number}}
 * @private
 */
function resolveCurrentPeriod({from, to}, now) {
    let start = from
    let next = addMonths(start, 1)
    while (next <= now && next < to) {
        start = next
        next = addMonths(start, 1)
    }
    const end = Math.min(next, to)
    return {
        start,
        end,
        elapsed: Math.max(1, Math.ceil((Math.min(now, end) - start) / DAY)),
        length: Math.max(1, Math.round((end - start) / DAY)),
        daysLeft: Math.max(0, Math.ceil((end - now) / DAY))
    }
}

/**
 * Photons charged within the window, totalled from the daily series the dashboard already loads
 * @param {{ts: Number, credits: Number}[]} [usage] - daily totals, `ts` in Unix seconds
 * @param {Number} start - epoch ms
 * @param {Number} end - epoch ms
 * @return {Number}
 * @private
 */
function sumPeriodUsage(usage, start, end) {
    if (!usage?.length)
        return 0
    let total = 0
    for (const {ts, credits} of usage) {
        const day = ts * 1000
        if (day >= new Date(start).setUTCHours(0, 0, 0, 0) && day < end) {
            total += credits || 0
        }
    }
    return total
}

/**
 * Allowance consumed so far this period, with the limits it is measured against
 * @param {{subscription: {}}} [account]
 * @param {{ts: Number, credits: Number}[]} [usage] - daily charged totals
 * @return {JSX.Element|null}
 */
export default function BillingPeriodView({account, usage}) {
    const subscription = account?.subscription
    if (!subscription)
        return null

    const {plan} = subscription
    const {photons: limit, requestsPerMinute, batchSize} = resolveSubscriptionLimits(subscription)
    const {start, end, elapsed, length, daysLeft} = resolveCurrentPeriod(subscription, Date.now())
    //totalled over the window shown rather than over a trailing month
    const used = sumPeriodUsage(usage, start, end)
    const consumed = limit ? Math.min(100, used / limit * 100) : 0
    const projected = Math.round(used / elapsed * length)
    const planName = findPlan(plan)?.name || plan

    const resets = `resets in ${describeDays(daysLeft)}`
    const period = `${dayMonth.format(start)} – ${dayMonthYear.format(end - 1)} · ${resets}`

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
                    <div className="billing-progress billing-quota space">
                        <div style={{width: `${consumed}%`}}/>
                        {!!limit && <span className="billing-quota-alert"
                                          style={{left: `${upgradeAlertThreshold}%`}}/>}
                    </div>
                    {!!limit && <div className="billing-quota-scale dimmed text-tiny">
                        <span>0</span>
                        <span>upgrade alert at {upgradeAlertThreshold}%</span>
                        <span>{formatWithAutoPrecision(limit)}</span>
                    </div>}
                    {!limit && <div className="billing-quota-scale dimmed text-tiny">
                        <span>No photon allowance included</span>
                    </div>}
                    <div className="row billing-period-facts micro-space text-small">
                        {!!requestsPerMinute && <div className="column column-33">
                            <div className="dimmed nano-space">Rate limit</div>
                            <div><strong>{formatWithAutoPrecision(requestsPerMinute)} req/min</strong></div>
                        </div>}
                        {!!batchSize && <div className="column column-33">
                            <div className="dimmed nano-space">Max batch size</div>
                            <div><strong>{formatWithAutoPrecision(batchSize)} items</strong></div>
                        </div>}
                        {!!used && <div className="column column-33">
                            <div className="dimmed nano-space">Projected period end</div>
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