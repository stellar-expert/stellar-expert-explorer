import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Tabs, parseQuery, useParams} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import UserSettingsView from '../../admin/user-settings-view'
import UserBillingHistoryFilterView from '../../admin/user-billing-history-filter'
import AccountOverviewView from '../../components/account-overview-view'
import BillingHistoryView from '../../components/billing-history-view'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'

/**
 * A customer account as staff see it - its settings, the usage overview the customer sees on their own
 * dashboard, and what it has been billed, one tab each
 * @return {JSX.Element}
 */
export default function UserPage() {
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const {id} = useParams()

    //re-read the account after an action the server applies on its own, like a deposit - without the loader,
    //so the page does not blink
    const reload = useCallback(() => apiRequest(`account/${id}`)
        .then(setSettings)
        .catch(error => notify({type: 'error', message: 'Failed to retrieve account data. ' + error?.message})), [id])

    useEffect(() => {
        if (!id)
            return
        setIsLoading(true)
        reload()
            .finally(() => setIsLoading(false))
    }, [id])

    const tabs = useMemo(() => [
        {
            name: 'settings',
            title: 'Settings',
            isDefault: true,
            render: () => isLoading ?
                <SegmentLoader inside/> :
                <UserSettingsView settings={settings} onUpdate={setSettings} onReload={reload}/>
        },
        {
            name: 'overview',
            title: 'Overview',
            render: () => <AccountOverviewView accountId={id} account={isLoading ? undefined : settings}
                                               planAction={{href: `/admin/user/${id}/subscription`, title: 'Change plan'}}/>
        },
        {
            name: 'billing-history',
            title: 'Billing history',
            render: () => <UserBillingHistoryView id={id}/>
        }
    ], [id, settings, isLoading, reload])

    const action = <span className="dimmed text-small">
        <code className="text-small billing-account-ref">account #{shortenString(id, 8)}</code>
        {!!settings.email && <>&nbsp;·&nbsp;{settings.email}</>}
    </span>

    //the header is rendered while the account loads, so moving between pages never shifts the title
    return <SimplePageLayout title="User account" action={action}>
        <Tabs tabs={tabs} queryParam="tab"/>
    </SimplePageLayout>
}

/**
 * What the account has been billed, within the period the filter picks
 * @param {String} id
 * @return {JSX.Element}
 * @private
 */
function UserBillingHistoryView({id}) {
    //only the period bounds - the query also carries the selected tab
    const [filters, setFilters] = useState(() => {
        const {from, to} = parseQuery()
        return {from, to}
    })

    return <div className="space">
        <UserBillingHistoryFilterView onChange={setFilters}/>
        <div className="micro-space">
            <BillingHistoryView account={id} filters={filters}/>
        </div>
    </div>
}
