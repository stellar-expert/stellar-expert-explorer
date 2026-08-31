import React from 'react'
import cn from 'classnames'
import {CopyToClipboard} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'

/**
 * Panel listing API keys or origins as copyable rows under a caption
 * @param {String|JSX.Element} [caption] - omitted where the surrounding section already names the list
 * @param {String[]} tokens
 * @param {String} [placeholder] - shown in place of the rows when the list is empty
 * @param {Number} [shorten] - trim a value longer than this many characters
 * @param {Function} [renderAction] - extra per-row action, rendered after the copy icon
 * @param {Function} [renderMeta] - detail about the value, sharing the row between it and the actions
 */
export default function TokenListView({caption, tokens = [], placeholder, shorten, renderAction, renderMeta}) {
    return <div>
        {!!caption && <div className="dimmed text-small">{caption}</div>}
        {!tokens.length && !!placeholder &&
            <div className="billing-token dimmed text-small text-center">{placeholder}</div>}
        {/*the description takes the slack of the row, so the actions sit at the trailing edge*/}
        {tokens.map(token => <div key={token} className="billing-token">
            {/*a shortened value is already short enough to keep on one line - a full one may need to wrap*/}
            <code className={cn('billing-code text-small', {nowrap: !!shorten})}>
                {shorten ? shortenString(token, shorten) : token}
            </code>
            {renderMeta?.(token)}
            <div className="nowrap text-small billing-token-actions">
                <CopyToClipboard text={token}/>
                {renderAction?.(token)}
            </div>
        </div>)}
    </div>
}