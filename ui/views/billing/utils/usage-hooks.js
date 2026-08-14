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

        const scope = allAccounts ? '' : `/${accountId}`
        Promise.all([apiRequest(`stats${scope}`), apiRequest(`usage${scope}`)])
            .then(([summary, usage]) => setState({summary, usage}))
            .catch(error => {
                notify({type: 'error', message: 'Failed to retrieve usage stats. ' + error?.message})
                //the chart zero-fills its window, so an empty series still renders the same 30 days
                setState({usage: []})
            })
    }, [accountId, allAccounts])

    return state
}