import React from 'react'
import {CopyToClipboard} from '@stellar-expert/ui-framework'
import ApiMethodBadge from './api-method-badge'

/**
 * Endpoint method and templated path, with path parameters highlighted
 * @param {String} method - lowercase HTTP method
 * @param {String} path - templated request path, e.g. "/explorer/{network}/asset"
 * @param {Boolean} [compact] - smaller variant without the copy button
 */
export default function ApiEndpointView({method, path, compact}) {
    return <div className={'api-endpoint' + (compact ? ' compact' : '')}>
        <ApiMethodBadge method={method} large={!compact}/>
        <span className="api-endpoint-path condensed">
            {path.split(/(\{[^}]+}|\/)/).filter(part => !!part).map((part, i) => {
                if (part === '/') //let long paths wrap between segments rather than mid-word
                    return <React.Fragment key={i}>/<wbr/></React.Fragment>
                if (part.startsWith('{'))
                    return <span key={i} className="api-path-param">{part}</span>
                return part
            })}
        </span>
        {!compact && <CopyToClipboard text={path} title="Copy endpoint path"/>}
    </div>
}
