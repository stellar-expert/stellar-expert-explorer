import React, {useCallback} from 'react'
import {UtcTimestamp} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {useSession} from '../auth/auth-session'
import {confirmAction} from '../utils/confirm-action'
import TokenListView from './token-list-view'

/**
 * Mirrors the cap enforced by `updateApiKeyList` on the server
 */
export const maxApiKeys = 5

const relativeTime = new Intl.RelativeTimeFormat('en', {numeric: 'auto', style: 'short'})
const relativeUnits = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
    ['year', Infinity]
]

/**
 * @param {String|Number|Date} value
 * @return {String}
 * @private
 */
function formatRelative(value) {
    let amount = (Date.now() - new Date(value).getTime()) / 1000
    for (const [unit, span] of relativeUnits) {
        if (Math.abs(amount) < span)
            //the short style abbreviates with a trailing dot ("2 min. ago") - drop it
            return relativeTime.format(-Math.round(amount), unit).replace('.', '')
        amount /= span
    }
    return relativeTime.format(-Math.round(amount), 'year')
}

/**
 * @param {{apiKeys: String[], updateApiKeys: Function, details: {}[]}} props
 * @return {JSX.Element}
 */
export default function UserApiKeysView({apiKeys = [], updateApiKeys, details}) {
    const {userId} = useSession()

    const saveApiKeys = useCallback(apiKeys => {
        apiRequest(`account/${userId}/api-key`, {
            method: 'POST',
            params: {apiKeys}
        })
            .then(() => notify({type: 'success', message: 'API key has been deleted'}))
            .catch(err => notify({type: 'error', message: err.message}))
    }, [userId])

    const removeApiKey = useCallback(async apiKey => {
        if (await confirmAction('Delete this API key?')) {
            updateApiKeys(prev => {
                const newApiKeyList = prev.filter(entry => entry !== apiKey)
                saveApiKeys(newApiKeyList)
                return newApiKeyList
            })
        }
    }, [updateApiKeys, saveApiKeys])

    /**
     * Issue date and last use of one key
     */
    const renderMeta = useCallback(apiKey => {
        const detail = details?.find(entry => entry.key === apiKey)
        if (!detail)
            return null
        return <div className="dimmed text-tiny billing-token-meta">
            <span className="nowrap">
                created {detail.created ? <UtcTimestamp date={detail.created} dateOnly/> : 'unknown'}
            </span>
            {detail.lastUsed ?
                //the request count stays out of the line and answers "how much" only on hover
                <span className="nowrap" title={`${formatWithAutoPrecision(detail.requests)} requests served`}>
                    last used {formatRelative(detail.lastUsed)}
                </span> :
                <span className="nowrap">never used</span>}
        </div>
    }, [details])

    const renderAction = useCallback(apiKey =>
        <a href="#" onClick={() => removeApiKey(apiKey)} className="icon-cancel" title="Delete API key"/>,
    [removeApiKey])

    const caption = <div className="dual-layout">
        <div>ACTIVE KEYS</div>
        <div>{apiKeys.length} of {maxApiKeys}</div>
    </div>

    return (
        <TokenListView
            caption={caption}
            tokens={apiKeys}
            shorten={16}
            placeholder="(No API keys generated yet)"
            renderMeta={renderMeta}
            renderAction={updateApiKeys ? renderAction : undefined}/>
    )
}