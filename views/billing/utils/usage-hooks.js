import {useEffect, useState} from 'react'
import {apiRequest} from '../../../business-logic/billing/billing-api'

/**
 * Load the charged-usage summary and the daily series behind the dashboard panels
 * @param {String} [accountId] - the single account to report on
 * @param {Boolean} [allAccounts] - report across every account instead (admin only)
 * @return {{summary: Object, usage: Object[]}} - both stay undefined until the requests settle
 */
export function useUsageStats(accountId, allAccounts) {
    const [state, setState] = useState({})

    useEffect(() => {
        if (!allAccounts && !accountId)
            return

        //switching away from a tab unmounts the panels before the stats arrive
        let cancelled = false
        const scope = allAccounts ? '' : `/${accountId}`
        Promise.all([apiRequest(`stats${scope}`), apiRequest(`usage${scope}`)])
            .then(([summary, usage]) => !cancelled && setState({summary, usage}))
            .catch(error => {
                if (cancelled)
                    return
                notify({type: 'error', message: 'Failed to retrieve usage stats. ' + error?.message})
                //the chart zero-fills its window, so an empty series still renders the same 30 days
                setState({usage: []})
            })
        return () => {
            cancelled = true
        }
    }, [accountId, allAccounts])

    return state
}