import React from 'react'
import {withRouter} from 'react-router'
import Alert from '../components/dialog'
import Footer from './footer-view'
import CatcherView from './catcher-view'

/**
 * Layout component for pages that require authorization.
 * Redirects non-authorized users to login page preserving return path in ?ret
 * @param {ReactNode} children - Page contents
 * @param {Object} menu - Top menu
 */
export default withRouter(function Layout ({children, menu}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        {menu}
        <div className="page-container"><CatcherView>{children}</CatcherView></div>
        <Footer/>
        <Alert/>
    </div>
})
