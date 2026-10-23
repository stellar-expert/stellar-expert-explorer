import React from 'react'
import cn from 'classnames'

/**
 * A highlighted line of copy - what blocks an action, or what happens next
 * @param {Boolean} [warning] - something the customer has to act on
 * @param {String} [className]
 * @param {*} children
 * @return {JSX.Element}
 */
export default function NoticeView({warning, className, children}) {
    return <div className={cn('billing-notice', {warning}, className)}>{children}</div>
}
