import React from 'react'
import {withRouter} from 'react-router'
import {Dropdown, SystemDialog} from '@stellar-expert/ui-framework'
import Footer from './footer-view'
import CatcherView from './catcher-view'
import {resolvePath} from '../../business-logic/path'

/**
 * Layout component for pages that require authorization.
 * Redirects non-authorized users to login page preserving return path in ?ret
 * @param {ReactNode} children - Page contents
 * @param {Object} menu - Top menu
 */
export default withRouter(function Layout({children, menu}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        {menu}
        <div className="page-container">
            {location.pathname.includes('explorer/public') && <div className="container">
                <div className="warning text-small" style={{padding: '1em'}}>
                    <i className="icon-warning"/> {' '}
                    StellarExpert is experiencing state inconsistencies due to the recent emergency upgrade to{' '}
                    <a href="https://stellar.org/blog/developers/addressing-state-archival-inconsistencies-protocol-upgrade-vote-next-week">protocol
                    24</a>. Our team is assessing remediation options. A complete service recovery may take
                    several days. Until further notice please cross-check critical data with other sources.
                </div>
            </div>}
            <CatcherView>{children}</CatcherView>
        </div>
        <Footer/>
        <SystemDialog/>
    </div>
})
