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

/**
 * The server counts the requests of each key over the last 30 days
 */
const usageWindow = 30 * 24 * 60 * 60 * 1000

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
 * Whether a key was issued within the 30 days the server reports its usage for
 * @param {String|Number|Date|null} created
 * @return {Boolean}
 * @private
 */
function isRecent(created) {
    return !!created && Date.now() - new Date(created).getTime() < usageWindow
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
                <span className="nowrap"
                      title={`${formatWithAutoPrecision(detail.requests)} requests served in the last 30 days`}>
                    last used {formatRelative(detail.lastUsed)}
                </span> :
                //usage is only looked up over the last 30 days, so an older key may have served requests before
                <span className="nowrap">
                    {isRecent(detail.created) ? 'never used' : 'not used in the last 30 days'}
                </span>}
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