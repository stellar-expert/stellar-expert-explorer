import React from 'react'
import SimplePageLayout from '../layout/simple-page-layout'

/**
 * Everything shared by the sign-in screens
 */

/**
 * Report a failure
 * @param {String} message
 */
export function fail(message) {
    notify({type: 'error', message})
}

/**
 * The card a sign-in screen sits in
 * @param {String} title
 * @param {Boolean} [textFirst] - the body opens with copy rather than with the form
 * @param {*} children
 * @return {JSX.Element}
 */
export function AuthScreenView({title, textFirst, children}) {
    return <div className={`container billing-login${textFirst ? ' text-first' : ''}`}>
        <div className="billing-login-form">
            <SimplePageLayout title={title}>
                {children}
            </SimplePageLayout>
        </div>
    </div>
}
