import React from 'react'
import cn from 'classnames'

/**
 * @param {String|Number} code - HTTP response status code
 * @return {'success'|'warning'|'error'}
 */
export function statusKind(code) {
    const status = +code
    if (status < 400)
        return 'success'
    if (status < 500)
        return 'warning'
    return 'error'
}

/**
 * HTTP response status code label
 * @param {String|Number} code - HTTP response status code
 */
export default function ApiStatusBadge({code}) {
    return <span className={cn('api-status', statusKind(code))}>{code}</span>
}
