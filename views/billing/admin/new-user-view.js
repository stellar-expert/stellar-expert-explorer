import React, {useCallback, useState} from 'react'
import {Button, Dropdown, UtcTimestamp, navigation} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {allPlans, findPlan, freePlan} from '../../../business-logic/billing/api-plans'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'
import FastValueView from '../utils/fast-value-view'

/**
 * Most free months a plan may be given away for - `maxFreeMonths` in the server's subscription.js
 */
const maxFreeMonths = 24

const planOptions = allPlans.map(plan => ({value: plan.key, title: plan.name}))

/**
 * What became of the invitation, as a toast
 * @param {{email: String, mailSent: Boolean}} res - as answered by `account` POST
 * @return {{type: String, message: String}}
 * @private
 */
function describeInvitation({email, mailSent}) {
    if (mailSent)
        return {type: 'success', message: `Account ${email} created - its owner has been told how to sign in`}
    return {
        type: 'warning',
        message: `Account ${email} created, but the invitation could not be mailed - its owner can still sign ` +
            'in with this address'
    }
}

/**
 * Creating an account for somebody, on any plan. A plan with a list price can be given away for free months
 * right here; a contract - a quoted plan, or a listed one that is paid for - is set up on the subscription
 * page the dialog leads to
 * @param {Function} onCreate - refreshes the account list
 * @return {JSX.Element}
 */
export default function NewUserView({onCreate}) {
    const [email, setEmail] = useState('')
    const [plan, setPlan] = useState(freePlan.key)
    const [freeMonths, setFreeMonths] = useState('')
    const [balance, setBalance] = useState('')
    const [isOpen, toggleDialog] = useDialogToggle()
    const [isProgress, setIsProgress] = useState(false)

    const changeEmail = useCallback(e => setEmail(e.target.value.trim()), [])
    const changeFreeMonths = useCallback(e => setFreeMonths(e.target.value.replace(/\D/g, '')), [])
    const changeBalance = useCallback(e => setBalance(e.target.value.trim().replace(/[^\d.]/g, '')), [])
    const addFixValue = useCallback(e => setBalance(e.currentTarget.dataset.amount), [])

    const selected = findPlan(plan)
    const months = Number(freeMonths)
    const isFree = !selected.price && !selected.custom
    const isGift = !!selected.price && months > 0
    //anything else on a paid plan is a contract, which the subscription page takes the terms of
    const isContract = !isFree && !isGift

    const create = useCallback(() => {
        const params = {email}
        if (isFree) {
            params.balance = balance
        } else if (isGift) {
            params.subscription = {plan, freeMonths: months}
        }
        setIsProgress(true)
        apiRequest(`account`, {method: 'POST', params})
            .then(res => {
                notify(describeInvitation(res))
                toggleDialog()
                if (isContract)
                    return navigation.navigate(`/admin/user/${res.id}/subscription?plan=${plan}`)
                //refresh user list
                onCreate()
            })
            .catch(err => notify({type: 'error', message: 'Failed to create account. ' + err.message}))
            .finally(() => setIsProgress(false))
    }, [email, plan, months, balance, isFree, isGift, isContract, onCreate, toggleDialog])

    const invalidMonths = months > maxFreeMonths

    return <div>
        <Button block small onClick={toggleDialog}>Add new user</Button>
        <ActionDialogView title="Create new account" dialogOpen={isOpen}
                          confirmTitle="Create"
                          disabled={isProgress || !email || invalidMonths} onConfirm={create} onCancel={toggleDialog}>
            <div className="space">
                <label className="dimmed text-small">User email</label>
                <input value={email} onChange={changeEmail}/>
            </div>
            <div className="micro-space">
                <label className="dimmed text-small">Plan</label>
                <div><Dropdown options={planOptions} value={plan} onChange={setPlan}/></div>
            </div>
            {isFree && <>
                <div className="micro-space">
                    <label className="dimmed text-small">Start balance</label>
                    <input value={balance} onChange={changeBalance}/>
                </div>
                <FastValueView onClick={addFixValue} className="text-right"/>
            </>}
            {!!selected.price && <div className="micro-space">
                <label className="dimmed text-small">Free months</label>
                <input value={freeMonths} onChange={changeFreeMonths} placeholder="none"/>
            </div>}
            <div className="dimmed text-tiny micro-space">
                <PlanTermsHint plan={selected} months={months} isContract={isContract}/>
            </div>
        </ActionDialogView>
    </div>
}

/**
 * What the account gets on the plan picked
 * @param {ApiPlan} plan
 * @param {Number} months - free months asked for
 * @param {Boolean} isContract
 * @return {JSX.Element|String}
 * @private
 */
function PlanTermsHint({plan, months, isContract}) {
    if (!plan.price && !plan.custom)
        return 'The start balance is optional.'
    if (isContract)
        return `The term${plan.custom ? ', limits and price' : ' and price'} of the plan are set on the next page.`
    if (months > maxFreeMonths)
        return `At most ${maxFreeMonths} free months.`
    //the server counts the term from the start of today, in UTC
    const ends = addMonthsClamped(new Date().setUTCHours(0, 0, 0, 0), months)
    return <>
        Free until <UtcTimestamp date={ends} dateOnly/>, then {freePlan.name}. Credits reset
        to {formatWithAutoPrecision(plan.limits.computeUnits)} compute units every month, and the customer can buy
        a plan at any time.
    </>
}

/**
 * Advance a timestamp by whole calendar months, landing on the last day of a shorter month - the way the
 * server ends a term of free months
 * @param {Number} ts
 * @param {Number} months
 * @return {Number}
 * @private
 */
function addMonthsClamped(ts, months) {
    const date = new Date(ts)
    const day = date.getUTCDate()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + months)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(day, lastDay))
    return date.getTime()
}
