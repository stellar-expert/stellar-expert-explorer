import React, {useCallback, useState} from 'react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {isValidEmail} from '../../../business-logic/billing/email'
import {useSession} from '../auth/auth-session'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'

const emptyRequest = {email: '', company: '', monthlyRequests: '', details: ''}

/**
 * Asks staff to quote a custom plan
 * @param {String} [dialogClassName] - lets a host page skin the dialog
 * @return {JSX.Element}
 */
export default function EnterpriseRequestView({dialogClassName}) {
    const {email} = useSession()
    const [isOpen, toggleDialog] = useDialogToggle()
    const [request, setRequest] = useState(emptyRequest)
    const [isProgress, setIsProgress] = useState(false)

    const openDialog = useCallback(() => {
        setRequest(prev => ({...prev, email: prev.email || email || ''}))
        toggleDialog()
    }, [email, toggleDialog])

    const changeField = useCallback(e => {
        const {name, value} = e.target
        setRequest(prev => ({...prev, [name]: name === 'monthlyRequests' ? value.replace(/\D/g, '') : value}))
    }, [])

    const submitRequest = useCallback(() => {
        setIsProgress(true)
        apiRequest('enterprise-request', {method: 'POST', auth: false, params: request})
            .then(() => {
                notify({type: 'success', message: 'Request sent. We will get back to you shortly'})
                setRequest(emptyRequest)
                toggleDialog()
            })
            .catch(error => notify({type: 'error', message: 'Failed to send the request. ' + error?.message}))
            .finally(() => setIsProgress(false))
    }, [request, toggleDialog])

    const isValid = isValidEmail(request.email)

    return <>
        <Button block outline onClick={openDialog}>Contact us</Button>
        {isOpen && <ActionDialogView title="Custom plan request" confirmTitle="Send request"
                                     disabled={!isValid || isProgress} onConfirm={submitRequest}
                                     onCancel={toggleDialog} className={dialogClassName} big>
            <div>
                Tell us how you intend to use the API and we will come back to you with a quote.
            </div>
            <div className="space">
                <label className="dimmed text-small">Email</label>
                <input type="email" name="email" value={request.email} onChange={changeField}
                       placeholder="you@company.com"/>
            </div>
            <div className="micro-space">
                <label className="dimmed text-small">Company name</label>
                <input name="company" value={request.company} onChange={changeField}/>
            </div>
            <div className="micro-space">
                <label className="dimmed text-small">Projected requests per month</label>
                <input name="monthlyRequests" value={request.monthlyRequests} onChange={changeField}
                       placeholder="100000"/>
            </div>
            <div className="micro-space">
                <label className="dimmed text-small">Additional information</label>
                <textarea name="details" value={request.details} onChange={changeField} rows={4}/>
            </div>
        </ActionDialogView>}
    </>
}