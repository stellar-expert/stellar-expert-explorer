import React, {useCallback, useEffect, useState} from 'react'
import ActionDialogView from './action-dialog-view'

let requestConfirmation

/**
 * Ask the user to confirm a destructive action
 * @param {String} message
 * @param {String} [confirmTitle]
 * @return {Promise<Boolean>}
 */
export function confirmAction(message, confirmTitle) {
    if (!requestConfirmation) {
        console.error('Cannot ask for confirmation - ConfirmationDialogView is not mounted')
        return Promise.resolve(false)
    }
    return new Promise(resolve => requestConfirmation({message, confirmTitle, resolve}))
}

/**
 * Host for `confirmAction` - shows at most one confirmation at a time
 */
export default function ConfirmationDialogView() {
    const [request, setRequest] = useState()

    useEffect(() => {
        requestConfirmation = setRequest
        return () => {
            requestConfirmation = undefined
        }
    }, [])

    const answer = useCallback(result => setRequest(prev => {
        prev?.resolve(result)
        return undefined
    }), [])

    const confirmRequest = useCallback(() => answer(true), [answer])
    const cancelRequest = useCallback(() => answer(false), [answer])

    useEffect(() => {
        if (!request)
            return
        function keyHandler(e) {
            if (e.key === 'Escape') {
                answer(false)
            } else if (e.key === 'Enter') {
                answer(true)
            }
        }

        window.addEventListener('keydown', keyHandler, true)
        return () => window.removeEventListener('keydown', keyHandler, true)
    }, [request, answer])

    if (!request)
        return null
    return <ActionDialogView title="Confirmation" confirmTitle={request.confirmTitle}
                             onConfirm={confirmRequest} onCancel={cancelRequest}>
        {request.message}
    </ActionDialogView>
}