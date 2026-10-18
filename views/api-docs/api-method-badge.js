import React from 'react'
import cn from 'classnames'

/**
 * HTTP method label, e.g. "GET"
 * @param {String} method - lowercase HTTP method
 * @param {Boolean} [large] - render the larger variant used in the endpoint headers
 */
export default function ApiMethodBadge({method, large}) {
    return <span className={cn('api-method', 'api-method-' + method, {large})}>{method}</span>
}
