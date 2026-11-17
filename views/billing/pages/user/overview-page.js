import React, {useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import AccountOverviewView from '../../components/account-overview-view'
import DestructiveActionsView from '../../user/destructive-actions-view'

/**
 * Account overview - counters, how much of the monthly allowance is spent, what spent it, and the
 * irreversible account actions at the bottom
 * @return {JSX.Element}
 */
export default function OverviewPage() {
    const {userId} = useSession()
    const [account, setAccount] = useState()

    useEffect(() => {
        if (!userId)
            return

        apiRequest(`account/${userId}`)
            .then(setAccount)
            .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message}))
    }, [userId])

    const action = <a href="/api-docs" target="_blank" className="text-small">API documentation&nbsp;→</a>

    return <SimplePageLayout title="Overview" action={action}>
        <AccountOverviewView accountId={userId} account={account}/>
        <div className="space">
            <DestructiveActionsView/>
        </div>
    </SimplePageLayout>
}