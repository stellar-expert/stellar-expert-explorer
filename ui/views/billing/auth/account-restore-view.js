import React, {useCallback, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {Button} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import SimplePageLayout from '../layout/simple-page-layout'
import {useSession} from './auth-session'

export default function AccountRestoreView() {
    const {reload} = useSession()
    const {logout} = useAuth0()
    const [isProgress, setIsProgress] = useState(false)

    const restore = useCallback(() => {
        setIsProgress(true)
        apiRequest('auth/restore', {method: 'POST'})
            .then(() => {
                notify({type: 'success', message: 'Your account has been restored'})
                reload()
            })
            .catch(e => {
                notify({type: 'error', message: 'Failed to restore the account. ' + e.message})
                if (e.status === 404) {
                    reload()
                }
            })
            .finally(() => setIsProgress(false))
    }, [reload])

    const logOut = useCallback(e => {
        e.preventDefault()
        logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        })
    }, [logout])

    return <div className="container">
        <div className="row micro-space">
            <div className="column column-50 column-offset-25">
                <SimplePageLayout title="Account deleted" center>
                    <div>
                        This account has been deleted. You can restore it right now and keep using the
                        service with the same email address. Credits held at the time of deletion were
                        burned and do not come back.
                    </div>
                    <div className="row space">
                        <div className="column column-50 column-offset-25">
                            <Button onClick={restore} disabled={isProgress} block>
                                Restore account
                            </Button>
                        </div>
                    </div>
                    <div className="text-center micro-space">
                        <a href="#" onClick={logOut} className="text-small">Log out</a>
                    </div>
                </SimplePageLayout>
            </div>
        </div>
    </div>
}