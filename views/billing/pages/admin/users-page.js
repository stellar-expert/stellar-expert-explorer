import React, {useCallback, useEffect, useState} from 'react'
import {apiRequest} from '../../../../business-logic/billing/billing-api'
import {useSession} from '../../auth/auth-session'
import SimplePageLayout from '../../layout/simple-page-layout'
import SegmentLoader from '../../utils/segment-loader-view'
import UserListView from '../../admin/user-list-view'
import NewUserView from '../../admin/new-user-view'

const accountsToLoad = 500

export default function UsersPage() {
    const {userId, synced} = useSession()
    const [accountList, setAccountList] = useState()
    const [isLoading, setIsLoading] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const refresh = useCallback(() => setRefreshKey(prev => ++prev), [])

    useEffect(() => {
        if (!userId)
            return
        setIsLoading(true)
        apiRequest(`account?limit=${accountsToLoad}`)
            .then(res => setAccountList(res.filter(account => account.id !== userId)))
            .catch(error => notify({type: 'error', message: 'Failed to retrieve accounts data. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [userId, refreshKey])

    const title = <>Users{!!accountList &&
        <span className="dimmed text-small">&nbsp;&nbsp;{accountList.length} total</span>}</>
    const isPending = !synced || isLoading

    return <SimplePageLayout title={title} action={<NewUserView onCreate={refresh}/>}>
        {isPending ? <SegmentLoader inside/> : <UserListView accounts={accountList} onUpdate={refresh}/>}
    </SimplePageLayout>
}